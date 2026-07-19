import sys
from pathlib import Path
from typing import Optional

_REPO_ROOT = str(Path(__file__).resolve().parents[2])
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.models.chat import ChatRequest, ChatResponse
from app.services.agent_service import generate_chat_response, generate_chat_response_stream, clear_chat_session
from app.services.pipeline_service import run_pipeline, get_available_prompts
from app.services.kb_service import list_categories, get_category_content
from agent.core.llm_client import check_connection
from agent.core import docker_manager
from agent.core.audit import audit
from app.api.playbooks import router as playbooks_router

app = FastAPI(title="ARES API", version="1.0.0")

audit.info("system", "api", "ARES API iniciada correctamente")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(docker_manager.router)
app.include_router(playbooks_router)


class PipelineRequest(BaseModel):
    prompt_id: str
    target: Optional[str] = None


@app.get("/")
def home():
    return {"message": "ARES online"}


@app.get("/status")
def status():
    return {"status": "ok", "service": "ares-backend"}


@app.get("/status/model")
def model_status():
    connected = check_connection()
    return {"ollama_connected": connected}


@app.get("/status/full")
def full_status():
    connected = check_connection()
    from pathlib import Path
    kb_root = Path(__file__).resolve().parents[2] / "agent" / "knowledge"
    kb_count = sum(1 for _ in kb_root.rglob("*.md")) if kb_root.exists() else 412
    return {
        "model": "DeepSeek V4 Flash",
        "modelStatus": "online" if connected else "offline",
        "kbDocuments": kb_count,
        "status": "Conectado" if connected else "Desconectado",
        "provider": "NVIDIA NIM",
    }


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    session = payload.session_id or "default"
    audit.info("chat_query", "api", f"Chat [{payload.mode}]: {payload.message[:80]}", {
        "mode": payload.mode, "session_id": session, "length": len(payload.message)
    })
    reply = generate_chat_response(payload.message, payload.mode, session_id=session)
    return ChatResponse(response=reply)


@app.post("/chat/stream")
def chat_stream(payload: ChatRequest):
    session = payload.session_id or "default"
    audit.info("chat_query", "api", f"Chat stream [{payload.mode}]: {payload.message[:80]}", {
        "mode": payload.mode, "session_id": session, "length": len(payload.message)
    })

    def event_generator():
        try:
            for chunk in generate_chat_response_stream(payload.message, payload.mode, session_id=session):
                yield f"data: {json.dumps(chunk)}\n\n"
        except ConnectionError as e:
            audit.error("chat_error", "api", f"Error en chat stream: {e}")
            yield f"data: {json.dumps(str(e))}\n\n"
        except Exception as e:
            audit.error("chat_error", "api", f"Error inesperado en chat: {e}")
            yield f"data: {json.dumps(f'Error inesperado en el servidor: {e}')}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/pipeline/prompts")
def list_pipeline_prompts():
    return get_available_prompts()


@app.post("/pipeline/start")
def start_pipeline(payload: PipelineRequest):
    audit.info("pipeline_start", "api", f"Pipeline iniciado: {payload.prompt_id}", {
        "prompt_id": payload.prompt_id, "target": payload.target
    })

    def event_generator():
        try:
            for event in run_pipeline(payload.prompt_id, target=payload.target):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            audit.error("pipeline_error", "api", f"Pipeline fall\u00f3: {payload.prompt_id} - {e}")
            yield f"data: {json.dumps({'type': 'pipeline:error', 'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/kb/categories")
def knowledge_categories():
    return list_categories()


@app.get("/kb/content")
def knowledge_content(category_id: str, subcategory_id: str):
    result = get_category_content(category_id, subcategory_id)
    if result is None:
        return {"error": "Contenido no encontrado"}, 404
    return result


@app.post("/chat/clear")
def chat_clear(payload: ChatRequest):
    session = payload.session_id or "default"
    clear_chat_session(session)
    audit.info("system", "api", f"Sesi\u00f3n limpiada: {session}")
    return {"status": "ok", "session_id": session}


# ---------------------------------------------------------------------------
# Evidencias / Audit Log
# ---------------------------------------------------------------------------


class AuditQuery(BaseModel):
    limit: Optional[int] = 100
    offset: Optional[int] = 0
    level: Optional[str] = None
    type: Optional[str] = None
    module: Optional[str] = None


@app.get("/audit/logs")
def audit_logs(
    limit: int = 100,
    offset: int = 0,
    level: Optional[str] = None,
    type: Optional[str] = None,
    module: Optional[str] = None,
):
    entries = audit.get_entries(limit=limit, offset=offset, level=level, type_=type, module=module)
    return {
        "entries": [
            {
                "id": e.id,
                "timestamp": e.timestamp,
                "level": e.level,
                "type": e.type,
                "module": e.module,
                "message": e.message,
                "details": e.details,
            }
            for e in entries
        ]
    }


@app.get("/audit/stats")
def audit_stats():
    return audit.get_stats()


@app.post("/audit/clear")
def audit_clear():
    audit.clear()
    audit.info("system", "api", "Registros de auditor\u00eda limpiados")
    return {"status": "ok"}
