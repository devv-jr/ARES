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
from .steps import docker_deploy, docker_destroy, ping, command, llm_analyze  # noqa: F401


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def run_playbook(playbook_id: str, target: str) -> AsyncIterator[PlaybookEvent]:
    """
    Ejecuta un playbook completo, cediendo eventos conforme avanza.
    El caller (endpoint FastAPI) se encarga de formatearlos como SSE.
    """
    playbook = get_playbook(playbook_id)
    ctx = StepContext(target=target)

    audit.info("playbook_start", "playbook",
        f"Playbook '{playbook_id}' iniciado contra {target or 'localhost'}",
        {"playbook_id": playbook_id, "target": target, "steps": len(playbook.steps)})

    for step in playbook.steps:
        yield PlaybookEvent(
            type="step_start", step_id=step.id, step_name=step.name, timestamp=_now()
        )
        audit.info("playbook_step", "playbook",
            f"Step '{step.name}' iniciado", {"step_id": step.id, "step_type": step.type})
        try:
            executor = get_executor(step.type)
            async for line in executor.run(step, ctx):
                yield PlaybookEvent(
                    type="step_output", step_id=step.id, data=line, timestamp=_now()
                )
        except Exception as e:
            audit.error("playbook_error", "playbook",
                f"Step '{step.name}' fall\u00f3: {e}", {"step_id": step.id, "error": str(e)})
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
            yield PlaybookEvent(type="playbook_end", data="failed", timestamp=_now())
            audit.warn("playbook_end", "playbook",
                f"Playbook '{playbook_id}' fall\u00f3 en step '{step.name}'")
            return

        yield PlaybookEvent(
            type="step_end", step_id=step.id, step_name=step.name, timestamp=_now()
        )

    yield PlaybookEvent(type="playbook_end", data="success", timestamp=_now())
    audit.info("playbook_end", "playbook",
        f"Playbook '{playbook_id}' completado exitosamente",
        {"playbook_id": playbook_id, "target": target})
