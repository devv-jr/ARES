"""
Step: llm_analyze
Envía los outputs de steps previos + un prompt a la cadena de LLMs de ARES
(NVIDIA NIM -> OpenRouter -> Ollama) y transmite la respuesta en streaming.
"""
import asyncio

from ..models import PlaybookStep
from .base import StepExecutor, StepContext, register
from agent.core import llm_client

# Límite de contexto previo para no saturar free tier / timeouts en 2º–3º llm_analyze
_MAX_PREV_CHARS = 6000
_MAX_SINGLE_OUT = 3500


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


def _trim(text: str, limit: int) -> str:
    text = text or ""
    if len(text) <= limit:
        return text
    return text[:limit] + "\n...[truncado]..."


def _build_previous_output(outputs: dict) -> str:
    parts: list[str] = []
    total = 0
    items = list(outputs.items())
    # Preferir outputs recientes (últimos steps) si hay que cortar
    for step_id, out in reversed(items):
        block = f"[{step_id}]\n{_trim(str(out), _MAX_SINGLE_OUT)}"
        if total + len(block) > _MAX_PREV_CHARS and parts:
            break
        parts.append(block)
        total += len(block)
    parts.reverse()
    return "\n\n".join(parts)


@register("llm_analyze")
class LLMAnalyzeExecutor(StepExecutor):
    async def run(self, step: PlaybookStep, ctx: StepContext):
        if not step.prompt:
            raise ValueError(f"Step '{step.id}' de tipo llm_analyze requiere 'prompt'")

        previous_output = _build_previous_output(ctx.outputs)
        full_prompt = f"{step.prompt}\n\nResultados previos:\n{previous_output}"

        messages = [
            {
                "role": "system",
                "content": (
                    "Eres ARES, un asistente de ciberseguridad. "
                    "Responde de forma técnica y profesional en español. "
                    "No uses bloques de pensamiento interno; entrega solo el informe final."
                ),
            },
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
