"""Persistencia de conversaciones en JSON (disco local).

Sin dependencias externas. Listo para sustituir por SQLite/Postgres
sin cambiar los endpoints ni el service layer.
"""
from __future__ import annotations

import json
import threading
from pathlib import Path

from app.models.conversation import Conversation

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "conversations"
_lock = threading.Lock()


def _ensure_dir() -> Path:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    return _DATA_DIR


def _path_for(conversation_id: str) -> Path:
    safe = conversation_id.replace("..", "").replace("/", "").replace("\\", "")
    return _ensure_dir() / f"{safe}.json"


def save(conversation: Conversation) -> Conversation:
    path = _path_for(conversation.id)
    with _lock:
        path.write_text(
            conversation.model_dump_json(indent=2),
            encoding="utf-8",
        )
    return conversation


def load(conversation_id: str) -> Conversation | None:
    path = _path_for(conversation_id)
    if not path.is_file():
        return None
    with _lock:
        raw = path.read_text(encoding="utf-8")
    try:
        return Conversation.model_validate_json(raw)
    except Exception:
        return None


def delete(conversation_id: str) -> bool:
    path = _path_for(conversation_id)
    with _lock:
        if not path.is_file():
            return False
        path.unlink()
        return True


def list_all() -> list[Conversation]:
    directory = _ensure_dir()
    items: list[Conversation] = []
    with _lock:
        files = sorted(directory.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        for path in files:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                items.append(Conversation.model_validate(data))
            except Exception:
                continue
    items.sort(key=lambda c: c.updated_at, reverse=True)
    return items
