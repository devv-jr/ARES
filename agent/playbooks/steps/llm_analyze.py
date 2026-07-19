"""
Step: llm_analyze
Envía los outputs de steps previos + un prompt a la cadena de LLMs de ARES
(NVIDIA NIM -> OpenRouter -> Ollama) y transmite la respuesta en streaming.
"""
import asyncio

from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from agent.core import llm_client


def _chunk_by_words(text: str):
    """Genera chunks más legibles: emite palabras completas, no caracteres sueltos."""
    buffer = []
    for ch in text:
        buffer.append(ch)
        if ch in (" ", "\n", "\t"):
            yield "".join(buffer)
            buffer.clear()
    if buffer:
        yield "".join(buffer)


@register("llm_analyze")
class LLMAnalyzeExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not step.prompt:
            raise ValueError(f"Step '{step.id}' de tipo llm_analyze requiere 'prompt'")

        previous_output = "\n\n".join(
            f"[{step_id}]\n{out}" for step_id, out in ctx.outputs.items()
        )
        full_prompt = f"{step.prompt}\n\nResultados previos:\n{previous_output}"

        messages = [
            {"role": "system", "content": "Eres ARES, un asistente de ciberseguridad. Responde de forma técnica y profesional."},
            {"role": "user", "content": full_prompt},
        ]

        yield "ARES está analizando los resultados..."

        loop = asyncio.get_running_loop()
        queue: asyncio.Queue = asyncio.Queue()

        def producer():
            try:
                for chunk in llm_client.chat_stream(messages):
                    loop.call_soon_threadsafe(queue.put_nowait, ("chunk", chunk))
            except Exception as exc:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", exc))
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, ("done", None))

        loop.run_in_executor(None, producer)

        buffer: list[str] = []
        while True:
            kind, value = await queue.get()
            if kind == "done":
                break
            if kind == "error":
                raise value
            # Buffer por palabras para evitar el efecto "letra a letra" de algunas APIs
            for word_chunk in _chunk_by_words(value):
                buffer.append(word_chunk)
                yield word_chunk

        ctx.outputs[step.id] = "".join(buffer)
