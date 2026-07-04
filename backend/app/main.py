import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.models.chat import ChatRequest, ChatResponse
from app.services.agent_service import generate_chat_response, generate_chat_response_stream
from agent.core.llm_client import check_connection

app = FastAPI(title="ARES API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    reply = generate_chat_response(payload.message, payload.mode)
    return ChatResponse(response=reply)


@app.post("/chat/stream")
def chat_stream(payload: ChatRequest):
    def event_generator():
        try:
            for chunk in generate_chat_response_stream(payload.message, payload.mode):
                # Cada fragmento va como JSON para preservar saltos de línea
                # y caracteres especiales dentro del formato SSE.
                yield f"data: {json.dumps(chunk)}\n\n"
        except ConnectionError as e:
            yield f"data: {json.dumps(str(e))}\n\n"
        except Exception as e:
            yield f"data: {json.dumps(f'Error inesperado en el servidor: {e}')}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")