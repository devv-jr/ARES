"""Memoria conversacional ligera para ARES.

Almacena historial por session_id en memoria (dict de listas).
Diseñada para mantener bajo el consumo de tokens enviados al LLM.
"""

import os
import threading


_DEFAULT_MAX_TURNS = 3


def _max_turns() -> int:
    raw = os.environ.get("ARES_MAX_HISTORY_TURNS", str(_DEFAULT_MAX_TURNS))
    try:
        value = int(raw)
        return max(value, 1)
    except ValueError:
        return _DEFAULT_MAX_TURNS


class ConversationMemory:
    """Almacena mensajes de chat por sesión con un límite de turnos.

    Un "turno" es un par user+assistant. Se guardan los últimos N turnos
    para que el prompt no crezca indefinidamente.
    """

    def __init__(self):
        self._store: dict[str, list[dict]] = {}
        self._lock = threading.Lock()

    def add(self, session_id: str, role: str, content: str) -> None:
        """Agrega un mensaje al historial de la sesión."""
        with self._lock:
            if session_id not in self._store:
                self._store[session_id] = []
            self._store[session_id].append({"role": role, "content": content})
            self._trim(session_id)

    def get_messages(self, session_id: str) -> list[dict]:
        """Devuelve los últimos N turnos como lista de dicts role/content."""
        with self._lock:
            return list(self._store.get(session_id, []))

    def clear(self, session_id: str) -> None:
        """Limpia el historial de una sesión."""
        with self._lock:
            self._store.pop(session_id, None)

    def _trim(self, session_id: str) -> None:
        """Recorta el historial al número máximo de turnos (pares user+assistant)."""
        max_messages = _max_turns() * 2
        messages = self._store.get(session_id, [])
        if len(messages) > max_messages:
            self._store[session_id] = messages[-max_messages:]


# Instancia global — se comparte entre todas las requests del proceso.
memory = ConversationMemory()
