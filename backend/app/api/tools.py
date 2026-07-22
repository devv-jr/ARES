"""
Herramientas ARES — API lista para conectar UI.

Montaje:
    from app.api.tools import router as tools_router
    app.include_router(tools_router)

Endpoints:
    GET  /tools
    POST /tools/decode
    POST /tools/hash
    GET  /tools/cheatsheets/{os}          os = linux | windows
    GET  /tools/cheatsheets/{os}/{id}
"""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from agent.core.audit import audit
from app.services import tools_service as svc

router = APIRouter(prefix="/tools", tags=["tools"])


# ── Request bodies ──────────────────────────────────────────────────────

class DecodeRequest(BaseModel):
    """Hash Decoder — decodifica Base64 / Hex / URL."""
    value: str = Field(..., min_length=1, max_length=100_000, description="Texto a decodificar")
    encoding: Literal["auto", "base64", "hex", "url"] = Field(
        default="auto",
        description="Formato; auto prueba base64 → hex → url",
    )


class HashRequest(BaseModel):
    """Hash Generator — MD5 / SHA1 / SHA256 (/ SHA512)."""
    value: str = Field(..., max_length=1_000_000, description="Texto plano (UTF-8)")
    algorithms: list[Literal["md5", "sha1", "sha256", "sha512"]] | None = Field(
        default=None,
        description="Default: md5, sha1, sha256",
    )


# ── Routes ──────────────────────────────────────────────────────────────

@router.get("")
def list_tools():
    """Catálogo de herramientas (para tabs / grid de la sección Herramientas)."""
    return svc.list_tools()


@router.post("/decode")
def decode_tool(body: DecodeRequest):
    """
    Hash Decoder.

    Ejemplo:
      POST /tools/decode
      { "value": "SGVsbG8=", "encoding": "base64" }
      → { "ok": true, "encoding": "base64", "output": "Hello", ... }
    """
    result = svc.decode_value(body.value, body.encoding)
    if result.get("ok"):
        audit.info(
            "tool_decode",
            "api",
            f"Decode {result.get('encoding')}: {len(body.value)} chars → {result.get('bytes_length')} bytes",
            {"encoding": result.get("encoding"), "ok": True},
        )
    else:
        audit.warn(
            "tool_decode",
            "api",
            f"Decode falló: {result.get('error')}",
            {"encoding": body.encoding, "ok": False},
        )
    return result


@router.post("/hash")
def hash_tool(body: HashRequest):
    """
    Hash Generator.

    Ejemplo:
      POST /tools/hash
      { "value": "Hello" }
      → { "ok": true, "hashes": { "md5": "...", "sha1": "...", "sha256": "..." } }
    """
    result = svc.generate_hashes(body.value, body.algorithms)
    if result.get("ok"):
        audit.info(
            "tool_hash",
            "api",
            f"Hash generado ({result.get('input_bytes')} bytes)",
            {"algorithms": list((result.get("hashes") or {}).keys()), "ok": True},
        )
    else:
        audit.warn(
            "tool_hash",
            "api",
            f"Hash falló: {result.get('error')}",
            {"ok": False},
        )
    return result


@router.get("/cheatsheets/{os_name}")
def cheatsheet_list(
    os_name: Literal["linux", "windows"],
    q: str | None = Query(default=None, max_length=120, description="Búsqueda (ej: systemctl)"),
    category: str | None = Query(default=None, max_length=60),
    limit: int = Query(default=50, ge=1, le=200),
):
    """
    Linux Cheat Sheet / Windows Commands — listado y búsqueda.

    Ejemplo:
      GET /tools/cheatsheets/linux?q=systemctl
    """
    result = svc.list_cheatsheet(os_name, q=q, category=category, limit=limit)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Error")
    return result


@router.get("/cheatsheets/{os_name}/{entry_id}")
def cheatsheet_detail(os_name: Literal["linux", "windows"], entry_id: str):
    """
    Detalle de un comando (explicación completa + ejemplos).

    Ejemplo:
      GET /tools/cheatsheets/linux/systemctl
    """
    result = svc.get_cheatsheet_entry(os_name, entry_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error") or "No encontrado")
    return result
