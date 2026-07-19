"""
Endpoints de Playbooks. El backend solo hace de transporte: expone el
motor de agent/playbooks/ vía HTTP + SSE hacia el frontend.

Móntalo en tu app principal con:
    from app.api.playbooks import router as playbooks_router
    app.include_router(playbooks_router)
"""
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.core.audit import audit
from agent.playbooks import list_playbooks, get_playbook, run_playbook
from agent.playbooks.loader import PlaybookNotFoundError

router = APIRouter(prefix="/playbooks", tags=["playbooks"])


class RunPlaybookRequest(BaseModel):
    target: str


@router.get("")
async def get_playbooks():
    """Lista todos los playbooks disponibles (para pintar las cards en el frontend)."""
    return [pb.model_dump() for pb in list_playbooks()]


@router.get("/{playbook_id}")
async def get_playbook_detail(playbook_id: str):
    try:
        return get_playbook(playbook_id).model_dump()
    except PlaybookNotFoundError:
        raise HTTPException(status_code=404, detail="Playbook no encontrado")


@router.post("/{playbook_id}/run")
async def run_playbook_endpoint(playbook_id: str, body: RunPlaybookRequest):
    """
    Corre el playbook y transmite eventos por SSE.
    En el frontend, consume esto con EventSource o un fetch + ReadableStream,
    igual que ya haces con el streaming del chat.
    """
    try:
        get_playbook(playbook_id)
    except PlaybookNotFoundError:
        audit.error("playbook_error", "api", f"Playbook no encontrado: {playbook_id}")
        raise HTTPException(status_code=404, detail="Playbook no encontrado")

    audit.info("playbook_start", "api", f"Playbook '{playbook_id}' ejecutado contra {body.target}",
               {"playbook_id": playbook_id, "target": body.target})

    async def event_stream():
        async for event in run_playbook(playbook_id, body.target):
            yield f"data: {json.dumps(event.model_dump())}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
