"""
Modelos de datos para Playbooks de ARES.
Valida y tipa la estructura de los archivos JSON en definitions/.
"""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field


StepType = Literal[
    "docker_deploy",
    "docker_destroy",
    "ping",
    "command",
    "llm_analyze",
]


class PlaybookStep(BaseModel):
    id: str
    type: StepType
    name: str

    # Campos opcionales según el tipo de step
    image: str | None = None                       # docker_deploy
    command: str | None = None                      # command
    args: list[str] = Field(default_factory=list)   # command
    prompt: str | None = None                        # llm_analyze
    timeout: int = 60                                 # segundos, aplica a cualquier step


class PlaybookDefinition(BaseModel):
    id: str
    title: str
    subtitle: str = ""
    description: str = ""
    duration: str = ""
    tools: list[str] = Field(default_factory=list)
    steps: list[PlaybookStep]


class PlaybookEvent(BaseModel):
    """Evento emitido por el engine mientras corre un playbook (para SSE)."""
    type: Literal["step_start", "step_output", "step_end", "playbook_end", "error"]
    step_id: str | None = None
    step_name: str | None = None
    data: Any = None
    timestamp: str
