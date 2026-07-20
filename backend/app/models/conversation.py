from typing import Literal, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str
    conversation_id: str


class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    mode: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    messages: list[Message] = Field(default_factory=list)


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    mode: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    message_count: int = 0


class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    mode: Optional[str] = Field(default=None, max_length=50)
    provider: Optional[str] = Field(default=None, max_length=100)
    model: Optional[str] = Field(default=None, max_length=100)


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    mode: Optional[str] = Field(default=None, max_length=50)
    provider: Optional[str] = Field(default=None, max_length=100)
    model: Optional[str] = Field(default=None, max_length=100)


class AddMessageRequest(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=100_000)


class AddMessagesRequest(BaseModel):
    """Guarda uno o varios mensajes (p. ej. par user + assistant tras el stream)."""
    messages: list[AddMessageRequest] = Field(min_length=1, max_length=20)


class AddMessagesResponse(BaseModel):
    conversation: Conversation
    title_updated: bool = False
