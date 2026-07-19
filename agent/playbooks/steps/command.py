"""
Step: command
Ejecuta una herramienta externa (nmap, etc.) con args parametrizados,
sustituyendo placeholders como {target} contra el contexto actual.
"""
from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from ._subprocess_utils import stream_subprocess


@register("command")
class CommandExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not step.command:
            raise ValueError(f"Step '{step.id}' de tipo command requiere 'command'")

        resolved_args = [ctx.resolve(a) for a in step.args]
        full_cmd = [step.command, *resolved_args]

        yield f"Ejecutando: {' '.join(full_cmd)}"

        output_lines: list[str] = []
        async for line in stream_subprocess(*full_cmd, timeout=step.timeout):
            output_lines.append(line)
            yield line

        ctx.outputs[step.id] = "\n".join(output_lines)
