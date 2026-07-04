"""Rate limiter de token bucket para proteger el free tier de NVIDIA NIM.

Implementación in-process, thread-safe, sin dependencias externas.
Configurable via ARES_RPM_LIMIT (default 35, dejando 5 RPM de margen
sobre el límite real de 40 RPM).
"""

import os
import threading
import time


_DEFAULT_RPM_LIMIT = 35
_THROTTLE_MESSAGE = (
    "ARES está procesando demasiadas solicitudes por minuto. "
    "Espera unos segundos e intenta de nuevo."
)


def _rpm_limit() -> int:
    raw = os.environ.get("ARES_RPM_LIMIT", str(_DEFAULT_RPM_LIMIT))
    try:
        value = int(raw)
        return max(value, 1)
    except ValueError:
        return _DEFAULT_RPM_LIMIT


class TokenBucket:
    """Token bucket que se rellena gradualmente hasta el RPM configurado."""

    def __init__(self):
        self._lock = threading.Lock()
        self._tokens: float = float(_rpm_limit())
        self._last_refill: float = time.monotonic()

    def allow(self) -> bool:
        """Consume un token si hay disponibles. Devuelve True si la request puede pasar."""
        with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_refill
            limit = _rpm_limit()

            # Rellenar tokens proporcional al tiempo transcurrido
            refill = elapsed * (limit / 60.0)
            self._tokens = min(float(limit), self._tokens + refill)
            self._last_refill = now

            if self._tokens >= 1.0:
                self._tokens -= 1.0
                return True
            return False


# Instancia global
_bucket = TokenBucket()


def check_rate_limit() -> str | None:
    """Verifica si la request puede pasar.

    Returns:
        None si está permitida, o un mensaje de throttle si se excedió el límite.
    """
    if _bucket.allow():
        return None
    return _THROTTLE_MESSAGE
