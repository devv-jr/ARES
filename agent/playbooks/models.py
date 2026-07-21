"""
Modelos de datos para Playbooks / Mission Builder de ARES.
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
    "inspect_asset",
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
    asset: str | None = None                         # inspect_asset (relativo a assets/)
    timeout: int = 60                                 # segundos


class LabInfo(BaseModel):
    """Metadatos del lab Docker asociado a la misión (informativo)."""
    image: str | None = None
    description: str = ""


class PlaybookDefinition(BaseModel):
    id: str
    title: str
    subtitle: str = ""
    description: str = ""
    duration: str = ""
    tools: list[str] = Field(default_factory=list)
    steps: list[PlaybookStep]

    # Mission Builder metadata (opcionales, backward-compatible)
    category: str = "general"
    icon: str = "target"
    badge: str = ""
    difficulty: str = "intermediate"
    requires_target: bool = False
    lab: LabInfo | None = None


class PlaybookEvent(BaseModel):
    """Evento emitido por el engine mientras corre un playbook (para SSE)."""
    type: Literal["step_start", "step_output", "step_end", "playbook_end", "error", "run_meta"]
    step_id: str | None = None
    step_name: str | None = None
    data: Any = None
    timestamp: str
