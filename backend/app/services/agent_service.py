from pathlib import Path
import sys


REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from agent.core.agent import process_query, process_query_stream, clear_session


def generate_chat_response(message: str, mode: str | None = None, session_id: str = "default") -> str:
    return process_query(message, mode=mode, session_id=session_id)


def generate_chat_response_stream(message: str, mode: str | None = None, session_id: str = "default"):
    return process_query_stream(message, mode=mode, session_id=session_id)


def clear_chat_session(session_id: str = "default") -> None:
    clear_session(session_id)