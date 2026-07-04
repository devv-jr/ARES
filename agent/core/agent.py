import re
from pathlib import Path
from typing import Optional
import os

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

from agent.core import llm_client
from agent.core.memory import memory
from agent.core.rate_limiter import check_rate_limit
from agent.knowledge import retriever

# ---------------------------------------------------------------------------
# Rutas y configuración
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "system_prompt.txt"
PROMPT_DIR = Path(__file__).resolve().parent.parent / "prompts"
KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"
MAX_CONTEXT_CHARS = int(os.environ.get("ARES_MAX_CONTEXT_CHARS", "2000"))

# ---------------------------------------------------------------------------
# Mapas de modos y temas
# ---------------------------------------------------------------------------

MODE_PROMPTS = {
    "blue_team": "blue_team.txt",
    "red_team": "red_team.txt",
    "learning": "learning.txt",
    "developer": "developer.txt",
}

MODE_KEYWORDS = {
    "blue_team": (
        "defender",
        "blue team",
        "hardening",
        "mitigar",
        "proteger",
        "monitor",
        "alert",
        "incident",
        "logs",
        "response",
        "seguridad",
    ),
    "red_team": (
        "red team",
        "pentest",
        "pentesting",
        "explot",
        "exploit",
        "nmap",
        "sqlmap",
        "recon",
        "ataque",
        "vulnerab",
        "payload",
    ),
    "learning": (
        "aprender",
        "explic",
        "qué es",
        "que es",
        "tutorial",
        "guia",
        "guide",
        "learn",
        "basico",
        "fundamentos",
    ),
    "developer": (
        "api",
        "código",
        "codigo",
        "python",
        "docker",
        "pipeline",
        "devsecops",
        "deploy",
        "frontend",
        "backend",
        "program",
    ),
}

TOPIC_RULES = (
    ("linux.md", ("linux", "chmod", "chown", "sudo", "systemd", "journalctl", "bash", "shell", "permissions", "permiso", "process", "tcpdump", "lsof", "iptables", "ss ")),
    ("windows.md", ("windows", "powershell", "defender", "sysmon", "event log", "eventlog", "uac", "tasklist", "wevtutil", "services", "registry", "active directory")),
    ("python.md", ("python", "pip", "venv", "asyncio", "requests", "json", "regex", "scapy", "pandas", "script")),
    ("hacking_tools.md", ("nmap", "burp", "wireshark", "gobuster", "ffuf", "hydra", "sqlmap", "metasploit", "volatility", "yara", "tools")),
    ("owasp.md", ("owasp", "xss", "sqli", "sql injection", "csrf", "idor", "ssrf", "top 10", "broken access control", "web")),
    ("web.md", ("http", "https", "api rest", "rest", "web", "cookie", "csp", "csrf", "jwt", "cors")),
    ("networking.md", ("network", "networking", "tcp", "udp", "dns", "firewall", "routing", "subnet", "vlan", "proxy")),
    ("docker.md", ("docker", "container", "image", "compose", "kubernetes", "k8s", "pod", "registry")),
    ("mitre.md", ("mitre", "att&ck", "attck", "tactic", "technique", "attack chain", "kill chain")),
    ("malware.md", ("malware", "ransomware", "trojan", "virus", "worm", "payload", "persistence", "ioc", "av", "edr")),
    ("reverse.md", ("reverse", "reversing", "disassembly", "debug", "binary", "assembly", "ida", "ghidra", "radare2", "strings")),
    ("windows/persistence.md", ("persistencia", "run key", "scheduled task", "wmi persist", "startup folder", "dll hijacking", "bootkit", "com hijacking", "schtasks", "autorun")),
    ("windows/network_forensics.md", ("netstat", "establis", "listen", "time_wait", "conexion", "puerto", "tcp connection", "netowork forens", "get-nettcpconnection", "socket", "c2", "command and control")),
    ("linux/incident_response.md", ("incident", "triage", "forense", "sospechoso", "fileless", "live response", "auditd")),
)

# ---------------------------------------------------------------------------
# Patrones de guardrails (ahora generan hints, no cortocircuitan)
# ---------------------------------------------------------------------------

XSS_PATTERNS = (
    r"<\s*script",
    r"onerror\s*=",
    r"onload\s*=",
    r"javascript:",
    r"document\.cookie",
)

SQLI_TERMS = ("sql injection", "sqli", "union select", "or 1=1")
CREDENTIAL_TERMS = ("password", "credencial", "token", "apikey", "api key")

_GUARDRAIL_HINTS = {
    "xss": (
        "El usuario mencionó patrones relacionados con XSS. "
        "Si es una consulta educativa, explica el concepto y las defensas. "
        "Si parece un intento real, advierte sobre los riesgos y recomienda sanitización."
    ),
    "sqli": (
        "El usuario mencionó patrones relacionados con SQL Injection. "
        "Si es una consulta educativa, explica el concepto y las defensas. "
        "Si parece un intento real, recomienda consultas parametrizadas y principio de menor privilegio."
    ),
    "credentials": (
        "El usuario mencionó credenciales o secretos. "
        "Recuerda enfatizar nunca exponer secretos en logs, frontend o repositorios públicos."
    ),
}

# ---------------------------------------------------------------------------
# Funciones internas
# ---------------------------------------------------------------------------


def _load_system_prompt() -> str:
    try:
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "Eres ARES, un asistente de ciberseguridad educativo."


def _load_prompt_for_mode(mode: str) -> str:
    prompt_file = MODE_PROMPTS.get(mode, "system_prompt.txt")
    prompt_path = PROMPT_DIR / prompt_file
    try:
        return prompt_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return _load_system_prompt()


def _load_document(name: str) -> str:
    document_path = Path(KNOWLEDGE_DIR, Path(name))
    if not document_path.exists():
        document_path = _find_document(name)
    if not document_path.exists() and name != "cybersecurity.md":
        document_path = KNOWLEDGE_DIR / "cybersecurity.md"

    try:
        return document_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""


def _find_document(name: str) -> Path:
    normalized = Path(name).as_posix()
    for md_file in KNOWLEDGE_DIR.glob(f"**/{normalized}"):
        return md_file
    return KNOWLEDGE_DIR / name


def _split_paragraphs(text: str) -> list[str]:
    return [paragraph.strip() for paragraph in re.split(r"\n\s*\n", text) if paragraph.strip()]


def _score_paragraph(paragraph: str, keywords: tuple[str, ...]) -> int:
    lowered = paragraph.lower()
    return sum(1 for keyword in keywords if keyword in lowered)


def _select_relevant_paragraphs(document_name: str, message: str, limit: int = 1) -> str:
    """Selecciona los párrafos más relevantes de un documento.

    Por defecto limit=1 para mantener el contexto compacto y respetar el free tier.
    """
    document_text = _load_document(document_name)
    if not document_text:
        return ""

    paragraphs = _split_paragraphs(document_text)
    if not paragraphs:
        return document_text[:MAX_CONTEXT_CHARS]

    message_tokens = tuple(sorted({token for token in re.findall(r"\w+", message.lower()) if len(token) > 2}))
    scored_paragraphs = []

    for paragraph in paragraphs:
        score = _score_paragraph(paragraph, message_tokens)
        if score > 0:
          scored_paragraphs.append((score, paragraph))

    if not scored_paragraphs:
        return "\n\n".join(paragraphs[:limit])[:MAX_CONTEXT_CHARS]

    scored_paragraphs.sort(key=lambda item: item[0], reverse=True)
    return "\n\n".join(paragraph for _, paragraph in scored_paragraphs[:limit])[:MAX_CONTEXT_CHARS]


def _normalize_message(message: str) -> str:
    return re.sub(r"\s+", " ", message).strip()


def _contains_pattern(message: str, patterns: tuple[str, ...]) -> bool:
    lowered = message.lower()
    return any(re.search(pattern, lowered, re.IGNORECASE) for pattern in patterns)


def _score_keywords(message: str, keywords: tuple[str, ...]) -> int:
    lowered = message.lower()
    score = 0
    for keyword in keywords:
        if keyword in lowered:
            score += 1
    return score


def _infer_mode(message: str) -> str:
    best_mode = "learning"
    best_score = 0

    for mode, keywords in MODE_KEYWORDS.items():
        score = _score_keywords(message, keywords)
        if score > best_score:
            best_mode = mode
            best_score = score

    return best_mode


def _infer_topic_document(message: str) -> str:
    best_document = "cybersecurity.md"
    best_score = 0

    for document, keywords in TOPIC_RULES:
        score = _score_keywords(message, keywords)
        if score > best_score:
            best_document = document
            best_score = score

    return best_document


def _infer_topic_score(message: str, topic_document: str) -> int:
    for document, keywords in TOPIC_RULES:
        if document == topic_document:
            return _score_keywords(message, keywords)
    return 0


def _build_discrepancy_hint(message: str, topic_document: str) -> str:
    topic_score = _infer_topic_score(message, topic_document)
    if topic_score >= 2:
        return ""

    if topic_document == "cybersecurity.md":
        return ""

    topic_label = topic_document.replace(".md", "")
    return (
        "Posible discrepancia detectada entre la solicitud del usuario y la etiqueta inferida. "
        f"Prioriza la solicitud del usuario sobre la etiqueta '{topic_label}' si no coincide con el tema real."
    )


# ---------------------------------------------------------------------------
# Guardrails: detectan patrones y devuelven hints para el prompt
# ---------------------------------------------------------------------------


def _detect_guardrails(message: str) -> list[str]:
    """Analiza el mensaje y devuelve hints de seguridad para inyectar en el prompt.

    Ya no cortocircuita: el LLM decide cómo responder con el contexto del hint.
    """
    hints = []

    if _contains_pattern(message, XSS_PATTERNS):
        hints.append(_GUARDRAIL_HINTS["xss"])

    if any(term in message.lower() for term in SQLI_TERMS):
        hints.append(_GUARDRAIL_HINTS["sqli"])

    if any(term in message.lower() for term in CREDENTIAL_TERMS):
        hints.append(_GUARDRAIL_HINTS["credentials"])

    return hints


# ---------------------------------------------------------------------------
# Construcción del contexto y mensajes para el LLM
# ---------------------------------------------------------------------------


def _build_context(message: str, topic_document: str) -> str:
    topic_context = _select_relevant_paragraphs(topic_document, message)
    retriever_context = retriever.query(message, top_n=1)

    parts = []
    if topic_context:
        parts.append(topic_context)
    if retriever_context and retriever_context not in topic_context:
        parts.append(retriever_context)

    combined = "\n\n".join(parts).strip()
    return combined[:MAX_CONTEXT_CHARS]


def _build_messages(
    message: str,
    mode: str,
    topic_document: str,
    context: str,
    security_hints: list[str],
    history: list[dict],
) -> list[dict]:
    """Construye la lista de mensajes para enviar al LLM.

    Orden:
      1. system: system_prompt + role_prompt + security hints
      2. history: últimos N turnos de la conversación
      3. user: metadata de modo/tema + contexto + query actual
    """
    system_prompt = _load_system_prompt()
    role_prompt = _load_prompt_for_mode(mode)
    topic_label = topic_document.replace(".md", "")

    # --- System message ---
    system_parts = [system_prompt, role_prompt]
    if security_hints:
        hints_block = "\n".join(f"- {hint}" for hint in security_hints)
        system_parts.append(f"ALERTAS DE SEGURIDAD DETECTADAS:\n{hints_block}")

    system_content = "\n\n".join(system_parts)

    # --- User message (query actual) ---
    user_sections = [f"Modo: {mode}", f"Tema: {topic_label}"]
    discrepancy_hint = _build_discrepancy_hint(message, topic_document)
    if discrepancy_hint:
        user_sections.append(discrepancy_hint)
    if context:
        user_sections.append(f"Contexto relevante:\n{context}")
    user_sections.append(f"Consulta del usuario:\n{message}")

    # --- Ensamblar ---
    messages = [{"role": "system", "content": system_content}]

    # Insertar historial entre system y el mensaje actual
    for hist_msg in history:
        messages.append({"role": hist_msg["role"], "content": hist_msg["content"]})

    messages.append({"role": "user", "content": "\n\n".join(user_sections)})

    return messages


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------


def process_query(
    user_input: str,
    mode: Optional[str] = None,
    session_id: str = "default",
) -> str:
    """Procesa una consulta del usuario y devuelve la respuesta del LLM.

    Pipeline:
      1. Normalizar input
      2. Detectar guardrails → hints
      3. Inferir modo y tema
      4. Recuperar contexto del knowledge base
      5. Obtener historial de la sesión
      6. Construir mensajes
      7. Rate limit check
      8. Enviar al LLM
      9. Guardar en memoria
      10. Devolver respuesta
    """
    cleaned = _normalize_message(user_input)

    if not cleaned:
        return "Necesito un mensaje para analizarlo."

    # 1. Guardrails → hints (ya no cortocircuitan)
    security_hints = _detect_guardrails(cleaned)

    # 2. Inferir modo
    inferred_mode = (mode or "").strip().lower().replace(" ", "_")
    if inferred_mode not in MODE_PROMPTS:
        inferred_mode = _infer_mode(cleaned)

    # 3. Inferir tema y recuperar contexto
    topic_document = _infer_topic_document(cleaned)
    context = _build_context(cleaned, topic_document)

    # 4. Obtener historial
    history = memory.get_messages(session_id)

    # 5. Construir mensajes
    messages = _build_messages(cleaned, inferred_mode, topic_document, context, security_hints, history)

    # 6. Rate limit
    throttle = check_rate_limit()
    if throttle:
        return throttle

    # 7. Enviar al LLM
    try:
        response = llm_client.chat(messages)
    except ConnectionError as e:
        return str(e)

    # 8. Guardar en memoria
    memory.add(session_id, "user", cleaned)
    memory.add(session_id, "assistant", response)

    return response


def generate_response(message: str) -> str:
    return process_query(message)


def process_query_stream(
    user_input: str,
    mode: Optional[str] = None,
    session_id: str = "default",
):
    """Igual que process_query, pero entrega la respuesta en fragmentos via streaming.

    Acumula la respuesta completa para guardarla en memoria al final del stream.
    """
    cleaned = _normalize_message(user_input)

    if not cleaned:
        yield "Necesito un mensaje para analizarlo."
        return

    # 1. Guardrails → hints
    security_hints = _detect_guardrails(cleaned)

    # 2. Inferir modo
    inferred_mode = (mode or "").strip().lower().replace(" ", "_")
    if inferred_mode not in MODE_PROMPTS:
        inferred_mode = _infer_mode(cleaned)

    # 3. Inferir tema y recuperar contexto
    topic_document = _infer_topic_document(cleaned)
    context = _build_context(cleaned, topic_document)

    # 4. Obtener historial
    history = memory.get_messages(session_id)

    # 5. Construir mensajes
    messages = _build_messages(cleaned, inferred_mode, topic_document, context, security_hints, history)

    # 6. Rate limit
    throttle = check_rate_limit()
    if throttle:
        yield throttle
        return

    # 7. Stream del LLM, acumulando para guardar en memoria
    accumulated = []
    try:
        for chunk in llm_client.chat_stream(messages):
            accumulated.append(chunk)
            yield chunk
    except ConnectionError as e:
        yield str(e)
        return

    # 8. Guardar en memoria
    full_response = "".join(accumulated)
    if full_response:
        memory.add(session_id, "user", cleaned)
        memory.add(session_id, "assistant", full_response)


def clear_session(session_id: str = "default") -> None:
    """Limpia el historial de una sesión."""
    memory.clear(session_id)