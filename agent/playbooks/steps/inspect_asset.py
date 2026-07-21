"""
Step: inspect_asset
Lee un archivo de agent/playbooks/assets/ y lo expone al contexto
(para análisis de logs, IOC, PCAP hex, etc. sin depender del host).
"""
from pathlib import Path

from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register

ASSETS_DIR = Path(__file__).resolve().parents[1] / "assets"


@register("inspect_asset")
class InspectAssetExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not step.asset:
            raise ValueError(f"Step '{step.id}' de tipo inspect_asset requiere 'asset'")

        # Evitar path traversal
        safe_name = Path(step.asset).name
        path = (ASSETS_DIR / safe_name).resolve()
        if not str(path).startswith(str(ASSETS_DIR.resolve())):
            raise ValueError(f"Asset no permitido: {step.asset}")
        if not path.is_file():
            raise FileNotFoundError(f"Asset no encontrado: {safe_name}")

        yield f"Cargando asset de misión: {safe_name}"
        text = path.read_text(encoding="utf-8", errors="replace")
        # Limitar tamaño en output SSE
        preview = text if len(text) <= 12_000 else text[:12_000] + "\n...[truncado]..."
        for line in preview.splitlines():
            yield line
        ctx.outputs[step.id] = text
        yield f"Asset '{safe_name}' cargado ({len(text)} chars)."
