"""
ARES · Docker/Vulhub Manager
-------------------------------------------------------------------------
Gestiona el ciclo de vida de laboratorios Vulhub vía `docker compose`,
usando subprocess con listas de argumentos (NUNCA shell=True) y una
whitelist explícita de escenarios permitidos, para evitar inyección de
comandos desde el frontend.

Flujo esperado:
  1. Frontend pide iniciar un escenario -> POST /api/vulhub/start
  2. Este módulo hace `docker compose up -d` en la carpeta del escenario
  3. Devuelve el container_id/name del servicio "vulnerable"
  4. Al terminar -> POST /api/vulhub/stop -> `docker compose down`

Integra esto en tu main.py existente con:
    from ares.core import docker_manager
    app.include_router(docker_manager.router)
"""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/vulhub", tags=["vulhub"])

# ---------------------------------------------------------------------------
# Configuración: ajusta esta ruta a donde tengas clonado el repo de Vulhub
# ---------------------------------------------------------------------------

VULHUB_ROOT = Path(__file__).resolve().parent.parent / "vulhub"

# Whitelist explícita: SOLO estos escenarios pueden levantarse.
# Clave = nombre que usa el frontend, Valor = ruta relativa dentro de VULHUB_ROOT
ALLOWED_SCENARIOS: dict[str, str] = {
    "apache-backdoor": "apache/CVE-2021-41773",
    "sql-injection-demo": "sqli/generic-sqli-lab",
    # Agrega más escenarios aquí conforme los vayas curando para el laboratorio.
}

COMPOSE_TIMEOUT_SECONDS = 60


class ScenarioRequest(BaseModel):
    scenario: str


class ScenarioStatus(BaseModel):
    scenario: str
    running: bool
    container_id: Optional[str] = None
    container_name: Optional[str] = None


def _scenario_path(scenario: str) -> Path:
    if scenario not in ALLOWED_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Escenario '{scenario}' no está en la whitelist.")
    scenario_path = VULHUB_ROOT / ALLOWED_SCENARIOS[scenario]
    if not scenario_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró el docker-compose.yml de '{scenario}' en {scenario_path}.",
        )
    return scenario_path


def _run(args: list[str], cwd: Path) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            args,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=COMPOSE_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Docker compose tardó demasiado en responder.")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Docker no está instalado o no está en el PATH.")


def _primary_container_id(cwd: Path) -> Optional[str]:
    """Devuelve el ID del primer contenedor corriendo para este docker-compose."""
    result = _run(["docker", "compose", "ps", "-q"], cwd)
    if result.returncode != 0:
        return None
    container_ids = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    return container_ids[0] if container_ids else None


@router.get("/list")
def list_scenarios() -> list[str]:
    """Devuelve los escenarios permitidos (whitelist), no todo el repo de Vulhub."""
    return sorted(ALLOWED_SCENARIOS.keys())


@router.post("/start", response_model=ScenarioStatus)
def start_scenario(payload: ScenarioRequest) -> ScenarioStatus:
    scenario_path = _scenario_path(payload.scenario)

    result = _run(["docker", "compose", "up", "-d"], scenario_path)
    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Fallo al levantar '{payload.scenario}': {result.stderr.strip()[:500]}",
        )

    container_id = _primary_container_id(scenario_path)
    if not container_id:
        raise HTTPException(
            status_code=500,
            detail=f"'{payload.scenario}' se levantó pero no se pudo identificar el contenedor.",
        )

    return ScenarioStatus(
        scenario=payload.scenario,
        running=True,
        container_id=container_id,
    )


@router.post("/stop", response_model=ScenarioStatus)
def stop_scenario(payload: ScenarioRequest) -> ScenarioStatus:
    scenario_path = _scenario_path(payload.scenario)

    result = _run(["docker", "compose", "down"], scenario_path)
    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Fallo al detener '{payload.scenario}': {result.stderr.strip()[:500]}",
        )

    return ScenarioStatus(scenario=payload.scenario, running=False)


@router.get("/status/{scenario}", response_model=ScenarioStatus)
def scenario_status(scenario: str) -> ScenarioStatus:
    scenario_path = _scenario_path(scenario)
    container_id = _primary_container_id(scenario_path)
    return ScenarioStatus(
        scenario=scenario,
        running=bool(container_id),
        container_id=container_id,
    )
