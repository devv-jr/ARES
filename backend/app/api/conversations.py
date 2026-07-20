"""
Endpoints de conversaciones persistentes.

Montaje:
    from app.api.conversations import router as conversations_router
    app.include_router(conversations_router)
"""
from fastapi import APIRouter, HTTPException

from app.models.conversation import (
    AddMessageRequest,
    AddMessagesResponse,
    Conversation,
    ConversationSummary,
    CreateConversationRequest,
    UpdateConversationRequest,
)
from app.services import conversation_service as svc
from agent.core.audit import audit

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=Conversation)
def create_conversation(payload: CreateConversationRequest | None = None):
    conversation = svc.create_conversation(payload)
    audit.info(
        "conversation_create",
        "api",
        f"Conversación creada: {conversation.id[:8]}…",
        {"conversation_id": conversation.id, "mode": conversation.mode},
    )
    return conversation


@router.get("", response_model=list[ConversationSummary])
def list_conversations():
    return svc.list_conversations()


@router.get("/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str):
    conversation = svc.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return conversation


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: str):
    conversation = svc.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return {"messages": conversation.messages}


@router.post("/{conversation_id}/messages", response_model=AddMessagesResponse)
def add_messages(conversation_id: str, payload: dict):
    """Acepta un mensaje `{role, content}` o un lote `{messages: [...]}`."""
    try:
        if isinstance(payload.get("messages"), list):
            items = [AddMessageRequest.model_validate(m) for m in payload["messages"]]
        elif "role" in payload and "content" in payload:
            items = [AddMessageRequest.model_validate(payload)]
        else:
            raise ValueError("Se requiere {role, content} o {messages: [...]}")
        if not items:
            raise ValueError("La lista de mensajes está vacía")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    conversation, title_updated = svc.add_messages(conversation_id, items)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    audit.info(
        "conversation_message",
        "api",
        f"Mensajes guardados en {conversation_id[:8]}… ({len(items)})",
        {
            "conversation_id": conversation_id,
            "count": len(items),
            "title_updated": title_updated,
        },
    )
    return AddMessagesResponse(conversation=conversation, title_updated=title_updated)


@router.patch("/{conversation_id}", response_model=Conversation)
def update_conversation(conversation_id: str, payload: UpdateConversationRequest):
    conversation = svc.update_conversation(conversation_id, payload)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return conversation


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str):
    ok = svc.delete_conversation(conversation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    audit.info(
        "conversation_delete",
        "api",
        f"Conversación eliminada: {conversation_id[:8]}…",
        {"conversation_id": conversation_id},
    )
    return {"status": "ok", "id": conversation_id}


@router.post("/{conversation_id}/activate", response_model=Conversation)
def activate_conversation(conversation_id: str):
    """Hidrata la memoria del agente con el historial persistido.
    Usa conversation.id como session_id en /chat/stream.
    """
    conversation = svc.activate_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    audit.info(
        "conversation_activate",
        "api",
        f"Conversación activada: {conversation_id[:8]}…",
        {"conversation_id": conversation_id, "messages": len(conversation.messages)},
    )
    return conversation
