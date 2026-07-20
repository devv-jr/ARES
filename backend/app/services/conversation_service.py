"""Lógica de negocio para conversaciones persistentes."""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from app.models.conversation import (
    AddMessageRequest,
    Conversation,
    ConversationSummary,
    CreateConversationRequest,
    Message,
    UpdateConversationRequest,
)
from app.services import conversation_store as store

_DEFAULT_TITLE = "Nueva conversación"
_DEFAULT_PROVIDER = "NVIDIA NIM"
_DEFAULT_MODEL = "DeepSeek V4 Flash"

_TOPIC_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bsql\s*injection\b|\bsqli\b", re.I), "SQL Injection"),
    (re.compile(r"\bxss\b|cross[-\s]?site\s*scripting", re.I), "XSS"),
    (re.compile(r"\bcsrf\b", re.I), "CSRF"),
    (re.compile(r"\bowasp\b", re.I), "OWASP"),
    (re.compile(r"\bapache\b", re.I), "Auditoría Apache"),
    (re.compile(r"\bnginx\b", re.I), "Auditoría Nginx"),
    (re.compile(r"\blinux\b", re.I), "Blue Team Linux"),
    (re.compile(r"\bwindows\b", re.I), "Windows Security"),
    (re.compile(r"\bmalware\b", re.I), "Análisis Malware"),
    (re.compile(r"\bpython\b", re.I), "Python Security"),
    (re.compile(r"\bdocker\b", re.I), "Docker Security"),
    (re.compile(r"\bkubernetes\b|\bk8s\b", re.I), "Kubernetes"),
    (re.compile(r"\bpentest\b|penetration\s*test", re.I), "Pentesting"),
    (re.compile(r"\bforens", re.I), "Forense"),
    (re.compile(r"\bnetwork\b|redes?\b", re.I), "Seguridad de Red"),
    (re.compile(r"\bfirewall\b", re.I), "Firewall"),
    (re.compile(r"\bcrypto|cifrado|encryption", re.I), "Criptografía"),
    (re.compile(r"\bauth|oauth|jwt\b", re.I), "Autenticación"),
    (re.compile(r"\blog\b|siem\b", re.I), "Análisis de Logs"),
    (re.compile(r"\bransomware\b", re.I), "Ransomware"),
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


def generate_title(user_text: str, mode: str | None = None) -> str:
    text = (user_text or "").strip()
    if not text:
        return _DEFAULT_TITLE

    for pattern, label in _TOPIC_PATTERNS:
        if pattern.search(text):
            return label

    cleaned = re.sub(r"\s+", " ", text)
    cleaned = re.sub(r"[^\w\s\-áéíóúüñÁÉÍÓÚÜÑ./]", "", cleaned, flags=re.UNICODE)
    words = [w for w in cleaned.split(" ") if w]
    if not words:
        if mode:
            return f"Sesión {mode.replace('_', ' ').title()}"
        return _DEFAULT_TITLE

    snippet = " ".join(words[:5])
    if len(snippet) > 48:
        snippet = snippet[:45].rstrip() + "…"
    return snippet[:1].upper() + snippet[1:] if snippet else _DEFAULT_TITLE


def create_conversation(payload: CreateConversationRequest | None = None) -> Conversation:
    payload = payload or CreateConversationRequest()
    now = _now_iso()
    conversation = Conversation(
        id=_new_id(),
        title=(payload.title or _DEFAULT_TITLE).strip() or _DEFAULT_TITLE,
        created_at=now,
        updated_at=now,
        mode=payload.mode,
        provider=payload.provider or _DEFAULT_PROVIDER,
        model=payload.model or _DEFAULT_MODEL,
        messages=[],
    )
    return store.save(conversation)


def list_conversations() -> list[ConversationSummary]:
    return [
        ConversationSummary(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            mode=c.mode,
            provider=c.provider,
            model=c.model,
            message_count=len(c.messages),
        )
        for c in store.list_all()
    ]


def get_conversation(conversation_id: str) -> Conversation | None:
    return store.load(conversation_id)


def delete_conversation(conversation_id: str) -> bool:
    return store.delete(conversation_id)


def update_conversation(
    conversation_id: str,
    payload: UpdateConversationRequest,
) -> Conversation | None:
    conversation = store.load(conversation_id)
    if conversation is None:
        return None

    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        conversation.title = data["title"].strip() or conversation.title
    if "mode" in data:
        conversation.mode = data["mode"]
    if "provider" in data:
        conversation.provider = data["provider"]
    if "model" in data:
        conversation.model = data["model"]

    conversation.updated_at = _now_iso()
    return store.save(conversation)


def add_messages(
    conversation_id: str,
    items: list[AddMessageRequest],
) -> tuple[Conversation | None, bool]:
    conversation = store.load(conversation_id)
    if conversation is None:
        return None, False

    had_exchange_before = _has_user_assistant_exchange(conversation)
    now = _now_iso()

    for item in items:
        conversation.messages.append(
            Message(
                id=_new_id(),
                role=item.role,
                content=item.content,
                timestamp=now,
                conversation_id=conversation.id,
            )
        )

    conversation.updated_at = now
    title_updated = False

    if not had_exchange_before and _has_user_assistant_exchange(conversation):
        first_user = next((m.content for m in conversation.messages if m.role == "user"), "")
        if conversation.title == _DEFAULT_TITLE or not conversation.title.strip():
            conversation.title = generate_title(first_user, conversation.mode)
            title_updated = True

    store.save(conversation)
    return conversation, title_updated


def _has_user_assistant_exchange(conversation: Conversation) -> bool:
    roles = {m.role for m in conversation.messages}
    return "user" in roles and "assistant" in roles


def activate_conversation(conversation_id: str) -> Conversation | None:
    """Carga el historial persistido en la memoria del agente (session_id = id)."""
    conversation = store.load(conversation_id)
    if conversation is None:
        return None

    from agent.core.memory import memory

    memory.clear(conversation_id)
    for msg in conversation.messages:
        if msg.role in ("user", "assistant") and msg.content:
            memory.add(conversation_id, msg.role, msg.content)

    return conversation
