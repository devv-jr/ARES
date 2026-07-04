import re
from pathlib import Path
from typing import Optional
import os

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

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
PROMPT_DIR = Path(__file__).resolve().parent.parent / "prompts"
KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"
MAX_CONTEXT_CHARS = int(os.environ.get("ARES_MAX_CONTEXT_CHARS", "3500"))

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
)


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
    document_path = KNOWLEDGE_DIR / name
    if not document_path.exists() and name != "cybersecurity.md":
        document_path = KNOWLEDGE_DIR / "cybersecurity.md"

    try:
        return document_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""


def _split_paragraphs(text: str) -> list[str]:
    return [paragraph.strip() for paragraph in re.split(r"\n\s*\n", text) if paragraph.strip()]


def _score_paragraph(paragraph: str, keywords: tuple[str, ...]) -> int:
    lowered = paragraph.lower()
    return sum(1 for keyword in keywords if keyword in lowered)


def _select_relevant_paragraphs(document_name: str, message: str, limit: int = 2) -> str:
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


def _build_context(message: str, topic_document: str) -> str:
    topic_context = _select_relevant_paragraphs(topic_document, message)
    retriever_context = retriever.query(message, top_n=2)

    parts = []
    if topic_context:
        parts.append(topic_context)
    if retriever_context and retriever_context not in topic_context:
        parts.append(retriever_context)

    combined = "\n\n".join(parts).strip()
    return combined[:MAX_CONTEXT_CHARS]


def _build_messages(message: str, mode: str, topic_document: str, context: str) -> list[dict]:
    system_prompt = _load_system_prompt()
    role_prompt = _load_prompt_for_mode(mode)
    topic_label = topic_document.replace(".md", "")

    system_content = f"{system_prompt}\n\n{role_prompt}"

    user_sections = [f"Modo detectado: {mode}", f"Tema detectado: {topic_label}"]
    if context:
        user_sections.append(f"Contexto relevante:\n{context}")
    user_sections.append(f"Consulta del usuario:\n{message}")

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": "\n\n".join(user_sections)},
    ]


def process_query(user_input: str, mode: Optional[str] = None) -> str:
    cleaned = _normalize_message(user_input)

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

    inferred_mode = (mode or "").strip().lower().replace(" ", "_")
    if inferred_mode not in MODE_PROMPTS:
        inferred_mode = _infer_mode(cleaned)

    topic_document = _infer_topic_document(cleaned)
    context = _build_context(cleaned, topic_document)
    messages = _build_messages(cleaned, inferred_mode, topic_document, context)

    try:
        return llm_client.chat(messages)
    except ConnectionError as e:
        return str(e)


def generate_response(message: str) -> str:
    return process_query(message)


def process_query_stream(user_input: str, mode: Optional[str] = None):
    """Igual que process_query, pero entrega la respuesta en fragmentos.

    Las respuestas instantáneas (XSS, SQLi, credenciales) se entregan como
    un único fragmento, ya que no vienen del LLM. Solo la respuesta del
    modelo se transmite en streaming real.
    """
    cleaned = _normalize_message(user_input)

    if not cleaned:
        yield "Necesito un mensaje para analizarlo."
        return

    if _contains_pattern(cleaned, XSS_PATTERNS):
        yield (
            "Se detectó un posible intento de XSS. "
            "Recomiendo escapar la salida, sanitizar el contenido y evitar renderizar HTML no confiable."
        )
        return

    if any(term in cleaned.lower() for term in ("sql injection", "sqli", "union select", "or 1=1")):
        yield (
            "Se detectó un posible intento de SQL Injection. "
            "Valida entradas, usa consultas parametrizadas y aplica el principio de menor privilegio."
        )
        return

    if any(term in cleaned.lower() for term in ("password", "credencial", "token", "apikey", "api key")):
        yield (
            "Puedo ayudarte a revisar el manejo de credenciales. "
            "Evita exponer secretos en logs, frontend o repositorios públicos."
        )
        return

    inferred_mode = (mode or "").strip().lower().replace(" ", "_")
    if inferred_mode not in MODE_PROMPTS:
        inferred_mode = _infer_mode(cleaned)

    topic_document = _infer_topic_document(cleaned)
    context = _build_context(cleaned, topic_document)
    messages = _build_messages(cleaned, inferred_mode, topic_document, context)

    try:
        for chunk in llm_client.chat_stream(messages):
            yield chunk
    except ConnectionError as e:
        yield str(e)