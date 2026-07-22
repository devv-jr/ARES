"""
Lógica de Herramientas ARES.

1. Hash Decoder  — decodifica encodings (Base64, Hex, URL)
2. Hash Generator — MD5 / SHA1 / SHA256
3. Linux Cheat Sheet  — stub listo (datos en data/cheatsheets/)
4. Windows Commands   — stub listo (datos en data/cheatsheets/)
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import re
import urllib.parse
from pathlib import Path
from typing import Any

_CHEATSHEETS_DIR = Path(__file__).resolve().parents[1] / "data" / "cheatsheets"

# ── Catálogo ────────────────────────────────────────────────────────────

TOOLS_CATALOG: list[dict[str, Any]] = [
    {
        "id": "hash_decoder",
        "title": "Hash Decoder",
        "subtitle": "Base64 · Hex · URL",
        "description": "Pega un valor codificado y ARES lo decodifica.",
        "status": "ready",
        "icon": "unlock",
        "endpoints": {
            "decode": "POST /tools/decode",
        },
    },
    {
        "id": "hash_generator",
        "title": "Hash Generator",
        "subtitle": "MD5 · SHA1 · SHA256",
        "description": "Genera hashes criptográficos a partir de texto plano.",
        "status": "ready",
        "icon": "hash",
        "endpoints": {
            "hash": "POST /tools/hash",
        },
    },
    {
        "id": "linux_cheatsheet",
        "title": "Linux Cheat Sheet",
        "subtitle": "Comandos y explicación",
        "description": "Busca un comando Linux y ARES explica su uso.",
        "status": "ready",
        "icon": "terminal",
        "endpoints": {
            "list": "GET /tools/cheatsheets/linux",
            "search": "GET /tools/cheatsheets/linux?q=systemctl",
            "detail": "GET /tools/cheatsheets/linux/{entry_id}",
        },
    },
    {
        "id": "windows_commands",
        "title": "Windows Commands",
        "subtitle": "CMD · PowerShell",
        "description": "Referencia de comandos Windows con explicación.",
        "status": "ready",
        "icon": "monitor",
        "endpoints": {
            "list": "GET /tools/cheatsheets/windows",
            "search": "GET /tools/cheatsheets/windows?q=ipconfig",
            "detail": "GET /tools/cheatsheets/windows/{entry_id}",
        },
    },
]


def list_tools() -> list[dict[str, Any]]:
    return TOOLS_CATALOG


# ── Decoder ─────────────────────────────────────────────────────────────

_SUPPORTED_ENCODINGS = ("base64", "hex", "url", "auto")


def _try_base64(raw: str) -> dict[str, Any] | None:
    s = raw.strip().replace("\n", "").replace("\r", "").replace(" ", "")
    if not s:
        return None
    # padding
    pad = (-len(s)) % 4
    if pad:
        s = s + ("=" * pad)
    try:
        decoded = base64.b64decode(s, validate=False)
    except (binascii.Error, ValueError):
        return None
    # Preferir texto UTF-8 legible; si no, hex
    try:
        text = decoded.decode("utf-8")
        if text and all(c.isprintable() or c in "\n\r\t" for c in text):
            return {
                "encoding": "base64",
                "input": raw.strip(),
                "output": text,
                "output_encoding": "utf-8",
                "raw_hex": decoded.hex(),
                "bytes_length": len(decoded),
            }
    except UnicodeDecodeError:
        pass
    return {
        "encoding": "base64",
        "input": raw.strip(),
        "output": decoded.hex(),
        "output_encoding": "hex",
        "raw_hex": decoded.hex(),
        "bytes_length": len(decoded),
    }


def _try_hex(raw: str) -> dict[str, Any] | None:
    s = raw.strip().replace(" ", "").replace("0x", "").replace("0X", "")
    if not s or len(s) % 2 != 0:
        return None
    if not re.fullmatch(r"[0-9a-fA-F]+", s):
        return None
    try:
        decoded = bytes.fromhex(s)
    except ValueError:
        return None
    try:
        text = decoded.decode("utf-8")
        if text and all(c.isprintable() or c in "\n\r\t" for c in text):
            return {
                "encoding": "hex",
                "input": raw.strip(),
                "output": text,
                "output_encoding": "utf-8",
                "raw_hex": decoded.hex(),
                "bytes_length": len(decoded),
            }
    except UnicodeDecodeError:
        pass
    return {
        "encoding": "hex",
        "input": raw.strip(),
        "output": decoded.hex(),
        "output_encoding": "hex",
        "raw_hex": decoded.hex(),
        "bytes_length": len(decoded),
    }


def _try_url(raw: str) -> dict[str, Any] | None:
    s = raw.strip()
    if not s or "%" not in s:
        # URL-decode sigue siendo válido sin % (no-op), solo si parece encoded
        if not re.search(r"\+|%[0-9A-Fa-f]{2}", s):
            return None
    try:
        out = urllib.parse.unquote_plus(s)
    except Exception:
        return None
    if out == s:
        return None
    return {
        "encoding": "url",
        "input": s,
        "output": out,
        "output_encoding": "utf-8",
        "raw_hex": out.encode("utf-8", errors="replace").hex(),
        "bytes_length": len(out.encode("utf-8", errors="replace")),
    }


def decode_value(value: str, encoding: str = "auto") -> dict[str, Any]:
    """
    Decodifica value según encoding: base64 | hex | url | auto.

    Respuesta:
      {
        "ok": true,
        "encoding": "base64",
        "input": "SGVsbG8=",
        "output": "Hello",
        "output_encoding": "utf-8",
        "raw_hex": "48656c6c6f",
        "bytes_length": 5,
        "chain": [...]   # solo en auto si hay múltiples intentos útiles
      }
    """
    if not value or not str(value).strip():
        return {"ok": False, "error": "Valor vacío", "encoding": encoding}

    enc = (encoding or "auto").lower().strip()
    if enc not in _SUPPORTED_ENCODINGS:
        return {
            "ok": False,
            "error": f"Encoding no soportado: {encoding}. Usa: {', '.join(_SUPPORTED_ENCODINGS)}",
            "encoding": encoding,
        }

    if enc == "base64":
        r = _try_base64(value)
        if r:
            return {"ok": True, **r}
        return {"ok": False, "error": "No es Base64 válido", "encoding": "base64", "input": value}

    if enc == "hex":
        r = _try_hex(value)
        if r:
            return {"ok": True, **r}
        return {"ok": False, "error": "No es Hex válido", "encoding": "hex", "input": value}

    if enc == "url":
        r = _try_url(value)
        if r:
            return {"ok": True, **r}
        return {"ok": False, "error": "No es URL-encoded válido", "encoding": "url", "input": value}

    # auto: probar en orden base64 → hex → url
    chain: list[dict[str, Any]] = []
    for fn, name in ((_try_base64, "base64"), (_try_hex, "hex"), (_try_url, "url")):
        r = fn(value)
        if r:
            chain.append(r)
    if not chain:
        return {
            "ok": False,
            "error": "No se pudo decodificar automáticamente (probó base64, hex, url)",
            "encoding": "auto",
            "input": value,
        }
    best = chain[0]
    return {"ok": True, **best, "chain": chain if len(chain) > 1 else None}


# ── Hash Generator ──────────────────────────────────────────────────────

_HASH_ALGOS = ("md5", "sha1", "sha256", "sha512")


def generate_hashes(value: str, algorithms: list[str] | None = None) -> dict[str, Any]:
    """
    Genera hashes del texto (UTF-8).

    Respuesta:
      {
        "ok": true,
        "input": "Hello",
        "input_bytes": 5,
        "hashes": {
          "md5": "...",
          "sha1": "...",
          "sha256": "..."
        }
      }
    """
    if value is None:
        return {"ok": False, "error": "Valor requerido"}

    data = value.encode("utf-8")
    algos = algorithms or ["md5", "sha1", "sha256"]
    algos = [a.lower().strip() for a in algos if a]
    unknown = [a for a in algos if a not in _HASH_ALGOS]
    if unknown:
        return {
            "ok": False,
            "error": f"Algoritmos no soportados: {unknown}. Usa: {', '.join(_HASH_ALGOS)}",
        }
    if not algos:
        algos = ["md5", "sha1", "sha256"]

    hashes: dict[str, str] = {}
    for a in algos:
        h = hashlib.new(a)
        h.update(data)
        hashes[a] = h.hexdigest()

    return {
        "ok": True,
        "input": value,
        "input_bytes": len(data),
        "hashes": hashes,
    }


# ── Cheat sheets (Linux / Windows) ──────────────────────────────────────

def _load_cheatsheet(os_name: str) -> list[dict[str, Any]]:
    path = _CHEATSHEETS_DIR / f"{os_name}.json"
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("entries"), list):
            return data["entries"]
    except (json.JSONDecodeError, OSError):
        return []
    return []


def list_cheatsheet(
    os_name: str,
    q: str | None = None,
    category: str | None = None,
    limit: int = 50,
) -> dict[str, Any]:
    """
    Lista / busca entradas del cheatsheet.

    Cada entrada:
      {
        "id": "systemctl",
        "command": "systemctl",
        "title": "Control de servicios systemd",
        "category": "services",
        "summary": "Gestiona servicios del sistema",
        "explanation": "Texto largo ARES...",
        "examples": ["systemctl status ssh", ...],
        "tags": ["systemd", "service"]
      }
    """
    os_key = os_name.lower().strip()
    if os_key not in ("linux", "windows"):
        return {"ok": False, "error": "OS debe ser linux o windows", "entries": []}

    entries = _load_cheatsheet(os_key)
    q_norm = (q or "").strip().lower()
    cat_norm = (category or "").strip().lower()

    filtered: list[dict[str, Any]] = []
    for e in entries:
        if cat_norm and (e.get("category") or "").lower() != cat_norm:
            continue
        if q_norm:
            blob = " ".join(
                [
                    str(e.get("id") or ""),
                    str(e.get("command") or ""),
                    str(e.get("title") or ""),
                    str(e.get("summary") or ""),
                    " ".join(e.get("tags") or []),
                ]
            ).lower()
            if q_norm not in blob:
                continue
        filtered.append(e)

    limit = max(1, min(int(limit or 50), 200))
    return {
        "ok": True,
        "os": os_key,
        "query": q or None,
        "category": category or None,
        "total": len(filtered),
        "entries": filtered[:limit],
    }


def get_cheatsheet_entry(os_name: str, entry_id: str) -> dict[str, Any]:
    os_key = os_name.lower().strip()
    if os_key not in ("linux", "windows"):
        return {"ok": False, "error": "OS debe ser linux o windows"}

    entries = _load_cheatsheet(os_key)
    eid = (entry_id or "").strip().lower()
    for e in entries:
        if str(e.get("id") or "").lower() == eid:
            return {"ok": True, "os": os_key, "entry": e}
        if str(e.get("command") or "").lower() == eid:
            return {"ok": True, "os": os_key, "entry": e}

    return {"ok": False, "error": f"Entrada no encontrada: {entry_id}", "os": os_key}
