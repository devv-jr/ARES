"""
Step: ping
Verifica conectividad básica contra el target (o el contenedor desplegado).

Usamos un connect TCP en vez de ICMP `ping` por dos razones:
  1. Con Docker Desktop (Windows/macOS) el target real es 127.0.0.1 con el
     puerto publicado del contenedor; el host siempre va a responder a un
     ping ICMP (es localhost), así que un ICMP ping no verifica nada útil
     ahí. Un connect TCP al puerto publicado sí confirma que el servicio
     del contenedor está arriba y aceptando conexiones.
  2. Evita los flags de `ping` que difieren entre Windows (`-n`/`-w`) y
     Linux/macOS (`-c`/`-W`), y no requiere privilegios elevados como sí
     puede exigir ICMP en algunos sistemas.
"""
import asyncio
import sys

from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from ._subprocess_utils import stream_subprocess


@register("ping")
class PingExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        target = ctx.container_ip or ctx.target
        port = ctx.container_port

        if port:
            # Target con puerto publicado (típicamente tras un docker_deploy):
            # connect TCP, más confiable que ICMP y sin requerir privilegios.
            yield f"Verificando conectividad TCP contra {target}:{port}..."
            try:
                _, writer = await asyncio.wait_for(
                    asyncio.open_connection(target, port), timeout=step.timeout
                )
                writer.close()
            except (OSError, asyncio.TimeoutError) as exc:
                raise RuntimeError(f"No se pudo conectar a {target}:{port}: {exc}") from exc
        else:
            # Sin puerto conocido (target externo, sin docker_deploy previo):
            # fallback a ICMP ping clásico, respetando flags por plataforma.
            yield f"Verificando conectividad ICMP contra {target}..."
            if sys.platform == "win32":
                cmd = ["ping", "-n", "3", "-w", "2000", target]
            else:
                cmd = ["ping", "-c", "3", "-W", "2", target]
            async for line in stream_subprocess(*cmd, timeout=step.timeout):
                yield line

        yield "Conectividad confirmada."
