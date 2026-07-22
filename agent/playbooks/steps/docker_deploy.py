"""
Step: docker_deploy
Levanta un contenedor vulnerable (imagen base de Vulhub) de forma aislada
para el playbook. `docker run` ya hace pull automático si la imagen no
está local, así que no hace falta un paso de pull separado.

Usamos SIEMPRE la IP del host (127.0.0.1) + el puerto publicado (`-P`) en
vez de la IP interna del contenedor: en Docker Desktop (Windows/macOS) los
contenedores viven dentro de una VM (WSL2/HyperKit) y su IP interna
(ej. 172.17.0.2) NO es alcanzable desde el host. Solo los puertos
publicados lo son. Esto también funciona igual en Linux nativo.
"""
import asyncio
import re
import subprocess
import uuid

from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from ._subprocess_utils import stream_subprocess

_PORT_MAPPING_RE = re.compile(r":(\d+)\s*$")

_DOCKER_DOWN_MSG = (
    "Docker Desktop no está en ejecución. "
    "Ábrelo desde el menú Inicio, espera a que el ícono diga 'Engine running' "
    "y vuelve a lanzar la misión. "
    "Las misiones con lab (Hardening Linux, Auditoría Web OWASP, Port Sweep) requieren Docker."
)


async def _docker_is_ready(timeout: int = 8) -> tuple[bool, str]:
    """Comprueba si el daemon de Docker responde. (ok, detalle)."""
    loop = asyncio.get_running_loop()

    def _check() -> tuple[bool, str]:
        try:
            proc = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=timeout,
                errors="replace",
            )
        except FileNotFoundError:
            return False, (
                "Docker no está instalado o no está en el PATH. "
                "Instala Docker Desktop y reinicia la terminal."
            )
        except subprocess.TimeoutExpired:
            return False, _DOCKER_DOWN_MSG
        except OSError as exc:
            return False, f"No se pudo ejecutar Docker: {exc}"

        if proc.returncode == 0:
            return True, "ok"

        detail = (proc.stderr or proc.stdout or "").strip()
        low = detail.lower()
        if (
            "dockerdesktoplinuxengine" in low
            or "cannot connect" in low
            or "daemon is not running" in low
            or "pipe" in low
        ):
            return False, _DOCKER_DOWN_MSG
        return False, detail or _DOCKER_DOWN_MSG

    return await loop.run_in_executor(None, _check)


async def _published_port(container_name: str) -> int | None:
    """Obtiene el puerto del host mapeado al primer puerto publicado (`docker port`)."""
    lines: list[str] = []
    try:
        async for line in stream_subprocess("docker", "port", container_name, timeout=15):
            lines.append(line)
    except Exception:
        return None

    for line in lines:
        match = _PORT_MAPPING_RE.search(line.strip())
        if match:
            return int(match.group(1))
    return None


async def _container_running(container_name: str) -> bool:
    """True si el contenedor sigue en ejecución."""
    lines: list[str] = []
    try:
        async for line in stream_subprocess(
            "docker", "inspect", "-f", "{{.State.Running}}", container_name, timeout=15
        ):
            lines.append(line.strip().lower())
    except Exception:
        return False
    return any(line == "true" for line in lines)


@register("docker_deploy")
class DockerDeployExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not step.image:
            raise ValueError(f"Step '{step.id}' de tipo docker_deploy requiere 'image'")

        yield "Comprobando Docker Desktop..."
        ok, detail = await _docker_is_ready()
        if not ok:
            raise RuntimeError(detail)

        container_name = f"ares_{step.id}_{uuid.uuid4().hex[:8]}"
        ctx.container_name = container_name

        # args opcionales = comando del contenedor (ej. sleep infinity en ubuntu)
        run_cmd = list(step.args) if step.args else []
        cmd_hint = f" → {' '.join(run_cmd)}" if run_cmd else ""
        yield f"Desplegando contenedor '{container_name}' desde imagen {step.image}{cmd_hint}..."

        # Limpiar cualquier contenedor huérfano con el mismo nombre (no debería
        # existir por el uuid, pero por si una corrida anterior quedó colgada)
        try:
            async for _ in stream_subprocess("docker", "rm", "-f", container_name, timeout=10):
                pass
        except RuntimeError:
            pass  # no existía, es lo normal

        # Levantar contenedor. `--pull missing` intenta descargar la imagen si
        # no está local. `-P` publica puertos EXPOSE de la imagen (si los hay).
        # step.args se pasa como comando del contenedor (mantiene vivo ubuntu, etc.).
        docker_args = [
            "docker", "run", "-d", "--rm",
            "--pull", "missing",
            "-P",
            "--name", container_name,
            step.image,
            *run_cmd,
        ]
        async for line in stream_subprocess(*docker_args, timeout=step.timeout):
            yield line

        # Esperar un instante a que el proceso main arranque (o salga)
        await asyncio.sleep(1.0)

        if not await _container_running(container_name):
            raise RuntimeError(
                f"El contenedor '{container_name}' se detuvo justo después de iniciar. "
                "Imágenes como ubuntu:22.04 necesitan un comando de keep-alive "
                "(ej. sleep infinity) en el step docker_deploy.args."
            )

        ctx.container_port = await _published_port(container_name)
        ctx.container_ip = "127.0.0.1"

        if ctx.container_port:
            yield f"Contenedor activo en {ctx.container_ip}:{ctx.container_port}"
        else:
            # Labs de inspección (hardening Linux) no exponen puertos: se usan vía docker exec
            yield (
                f"Contenedor activo '{container_name}' "
                "(sin puertos publicados; acceso vía docker exec)"
            )
