import re
from pathlib import Path

from agent.core import llm_client
from agent.knowledge import retriever

XSS_PATTERNS = (
    r"<\s*script",
    r"onerror\s*=",
    r"onload\s*=",
    r"javascript:",
    r"document\.cookie",
)

SYSTEM_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "system_prompt.txt"


def _load_system_prompt() -> str:
    try:
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "Eres ARES, un asistente de ciberseguridad educativo."


def _contains_pattern(message: str, patterns: tuple[str, ...]) -> bool:
    lowered = message.lower()
    return any(re.search(pattern, lowered, re.IGNORECASE) for pattern in patterns)


def generate_response(message: str) -> str:
    cleaned = message.strip()

    if not cleaned:
        return "Necesito un mensaje para analizarlo."

    if _contains_pattern(cleaned, XSS_PATTERNS):
        return (
            "Se detectó un posible intento de XSS. "
            "Recomiendo escapar la salida, sanitizar el contenido y evitar renderizar HTML no confiable."
        )

    if any(term in cleaned.lower() for term in ("sql injection", "sqli", "union select", "or 1=1")):
        return (
            "Se detectó un posible intento de SQL Injection. "
            "Valida entradas, usa consultas parametrizadas y aplica el principio de menor privilegio."
        )

    if any(term in cleaned.lower() for term in ("password", "credencial", "token", "apikey", "api key")):
        return (
            "Puedo ayudarte a revisar el manejo de credenciales. "
            "Evita exponer secretos en logs, frontend o repositorios públicos."
        )

    system_prompt = _load_system_prompt()
    context = retriever.query(cleaned)

    if context:
        user_content = f"Contexto relevante:\n{context}\n\n---\n\n{cleaned}"
    else:
        user_content = cleaned

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        return llm_client.chat(messages)
    except ConnectionError as e:
        return str(e)