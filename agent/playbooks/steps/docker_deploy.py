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
import re
import uuid

from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from ._subprocess_utils import stream_subprocess

_PORT_MAPPING_RE = re.compile(r":(\d+)\s*$")


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


@register("docker_deploy")
class DockerDeployExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not step.image:
            raise ValueError(f"Step '{step.id}' de tipo docker_deploy requiere 'image'")

        container_name = f"ares_{step.id}_{uuid.uuid4().hex[:8]}"
        ctx.container_name = container_name

        yield f"Desplegando contenedor '{container_name}' desde imagen {step.image}..."

        # Limpiar cualquier contenedor huérfano con el mismo nombre (no debería
        # existir por el uuid, pero por si una corrida anterior quedó colgada)
        try:
            async for _ in stream_subprocess("docker", "rm", "-f", container_name, timeout=10):
                pass
        except RuntimeError:
            pass  # no existía, es lo normal

        # Levantar contenedor. `--pull missing` intenta descargar la imagen si
        # no está local. `-P` publica los puertos expuestos en puertos
        # efímeros del host (vagrant/docker-machine friendly).
        async for line in stream_subprocess(
            "docker", "run", "-d", "--rm",
            "--pull", "missing",
            "-P",
            "--name", container_name,
            step.image,
            timeout=step.timeout,
        ):
            yield line

        ctx.container_port = await _published_port(container_name)
        if not ctx.container_port:
            raise RuntimeError(
                f"El contenedor '{container_name}' arrancó pero no se pudo obtener su puerto publicado. "
                "Revisa 'docker logs' del contenedor: puede haberse caído justo después de iniciar."
            )
        ctx.container_ip = "127.0.0.1"

        yield f"Contenedor activo en {ctx.container_ip}:{ctx.container_port}"
