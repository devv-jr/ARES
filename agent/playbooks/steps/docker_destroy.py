"""
Step: docker_destroy
Detiene y elimina el contenedor desplegado por docker_deploy (limpieza del entorno).
"""
from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from ._subprocess_utils import stream_subprocess


@register("docker_destroy")
class DockerDestroyExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not ctx.container_name:
            yield "No hay contenedor activo que destruir, se omite el step."
            return

        yield f"Deteniendo y eliminando contenedor '{ctx.container_name}'..."
        async for line in stream_subprocess(
            "docker", "stop", ctx.container_name, timeout=step.timeout
        ):
            yield line

        yield "Entorno limpiado correctamente."
        ctx.container_name = None
        ctx.container_ip = None
