"""Sistema de logging auditado para ARES — Evidencias.

Captura eventos del sistema con timestamp, nivel, tipo y m\u00f3dulo.
Thread-safe. Ring buffer configurable para no crecer indefinidamente.
"""

import os
import threading
import uuid
from datetime import datetime, timezone


_MAX_LOG_ENTRIES = int(os.environ.get("ARES_MAX_AUDIT_ENTRIES", "2000"))


class AuditEntry:
    __slots__ = ("id", "timestamp", "level", "type", "module", "message", "details")

    def __init__(self, level, type_, module, message, details=None):
        self.id = str(uuid.uuid4())[:8]
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.level = level
        self.type = type_
        self.module = module
        self.message = message
        self.details = details or {}


class AuditLogger:
    def __init__(self):
        self._entries = []
        self._lock = threading.Lock()

    def log(self, level, type_, module, message, details=None):
        entry = AuditEntry(level, type_, module, message, details)
        with self._lock:
            self._entries.append(entry)
            if len(self._entries) > _MAX_LOG_ENTRIES:
                self._entries = self._entries[-_MAX_LOG_ENTRIES:]
        return entry

    def info(self, type_, module, message, details=None):
        return self.log("info", type_, module, message, details)

    def warn(self, type_, module, message, details=None):
        return self.log("warn", type_, module, message, details)

    def error(self, type_, module, message, details=None):
        return self.log("error", type_, module, message, details)

    def get_entries(self, limit=200, offset=0, level=None, type_=None, module=None):
        with self._lock:
            entries = list(reversed(self._entries))

        if level:
            entries = [e for e in entries if e.level == level]
        if type_:
            entries = [e for e in entries if e.type == type_]
        if module:
            entries = [e for e in entries if e.module == module]

        return entries[offset:offset + limit]

    def get_stats(self):
        with self._lock:
            total = len(self._entries)
            by_level = {}
            by_type = {}
            for e in self._entries:
                by_level[e.level] = by_level.get(e.level, 0) + 1
                by_type[e.type] = by_type.get(e.type, 0) + 1
            return {
                "total": total,
                "by_level": by_level,
                "by_type": by_type,
            }

    def clear(self):
        with self._lock:
            self._entries = []


audit = AuditLogger()
