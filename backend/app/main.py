from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.chat import ChatRequest, ChatResponse
from app.services.agent_service import generate_chat_response
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
    reply = generate_chat_response(payload.message)
    return ChatResponse(response=reply)