"""
Motor de ejecución de playbooks. Corre los steps en orden y va emitiendo
PlaybookEvent listos para transmitirse por SSE al frontend.
"""
from datetime import datetime, timezone
from typing import AsyncIterator

from agent.core.audit import audit
from .loader import get_playbook
from .models import PlaybookEvent
from .steps.base import StepContext, get_executor

# Importa los ejecutores para que se registren en el _REGISTRY al cargar el módulo
from .steps import (  # noqa: F401
    docker_deploy,
    docker_destroy,
    ping,
    command,
    llm_analyze,
    inspect_asset,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def run_playbook(
    playbook_id: str,
    target: str = "",
    *,
    run_id: str | None = None,
) -> AsyncIterator[PlaybookEvent]:
    """
    Ejecuta un playbook completo, cediendo eventos conforme avanza.
    El caller (endpoint FastAPI) se encarga de formatearlos como SSE.

    Si se pasa run_id, se emite un evento run_meta al inicio para que el
    frontend / store de misiones pueda correlacionar la corrida.
    """
    playbook = get_playbook(playbook_id)
    ctx = StepContext(target=target or "")

    if run_id:
        yield PlaybookEvent(
            type="run_meta",
            data={"run_id": run_id, "playbook_id": playbook_id, "title": playbook.title},
            timestamp=_now(),
        )

    audit.info(
        "playbook_start",
        "playbook",
        f"Misión/Playbook '{playbook_id}' iniciado"
        + (f" contra {target}" if target else " (lab interno)"),
        {
            "playbook_id": playbook_id,
            "target": target or None,
            "steps": len(playbook.steps),
            "run_id": run_id,
            "mission": True,
        },
    )

    for step in playbook.steps:
        yield PlaybookEvent(
            type="step_start", step_id=step.id, step_name=step.name, timestamp=_now()
        )
        audit.info(
            "playbook_step",
            "playbook",
            f"Step '{step.name}' iniciado",
            {
                "step_id": step.id,
                "step_type": step.type,
                "playbook_id": playbook_id,
                "run_id": run_id,
            },
        )
        try:
            executor = get_executor(step.type)
            async for line in executor.run(step, ctx):
                yield PlaybookEvent(
                    type="step_output", step_id=step.id, data=line, timestamp=_now()
                )
        except Exception as e:
            audit.error(
                "playbook_error",
                "playbook",
                f"Step '{step.name}' falló: {e}",
                {
                    "step_id": step.id,
                    "error": str(e),
                    "playbook_id": playbook_id,
                    "run_id": run_id,
                },
            )
            yield PlaybookEvent(
                type="error", step_id=step.id, data=str(e), timestamp=_now()
            )
            if ctx.container_name:
                try:
                    cleanup_executor = get_executor("docker_destroy")
                    async for _ in cleanup_executor.run(step, ctx):
                        pass
                except Exception:
                    pass
            # data sigue siendo string para no romper PipelineView del frontend
            yield PlaybookEvent(type="playbook_end", data="failed", timestamp=_now())
            audit.warn(
                "playbook_end",
                "playbook",
                f"Misión '{playbook_id}' falló en step '{step.name}'",
                {"playbook_id": playbook_id, "run_id": run_id},
            )
            return

        yield PlaybookEvent(
            type="step_end", step_id=step.id, step_name=step.name, timestamp=_now()
        )

    yield PlaybookEvent(type="playbook_end", data="success", timestamp=_now())
    audit.info(
        "playbook_end",
        "playbook",
        f"Misión '{playbook_id}' completada exitosamente",
        {"playbook_id": playbook_id, "target": target or None, "run_id": run_id},
    )
