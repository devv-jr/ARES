"""
Clase base para ejecutores de steps + registro por tipo.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, AsyncIterator

from ..models import PlaybookStep


class StepContext:
    """Estado compartido entre steps de una misma ejecución de playbook."""

    def __init__(self, target: str):
        self.target = target
        self.container_name: str | None = None
        self.container_ip: str | None = None
        self.container_port: int | None = None
        self.outputs: dict[str, Any] = {}  # step_id -> resultado

    def resolve(self, value: str) -> str:
        """Sustituye placeholders como {target}/{port} en args de un step."""
        return value.format(
            target=self.container_ip or self.target,
            container_ip=self.container_ip or "",
            container_name=self.container_name or "",
            port=self.container_port or "",
        )


class StepExecutor(ABC):
    """Cada tipo de step (docker_deploy, ping, command, ...) implementa esto."""

    @abstractmethod
    async def run(self, step: PlaybookStep, ctx: StepContext) -> AsyncIterator[str]:
        """
        Ejecuta el step y va emitiendo líneas de output (para streaming SSE).
        Debe lanzar excepción si el step falla.
        """
        ...
        yield  # pragma: no cover  (hace de este método un generador)


_REGISTRY: dict[str, StepExecutor] = {}


def register(step_type: str):
    def decorator(cls):
        _REGISTRY[step_type] = cls()
        return cls
    return decorator


def get_executor(step_type: str) -> StepExecutor:
    if step_type not in _REGISTRY:
        raise ValueError(f"No hay ejecutor registrado para el step type '{step_type}'")
    return _REGISTRY[step_type]
