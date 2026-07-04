from pathlib import Path
import sys


REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from agent.core.agent import process_query, process_query_stream


def generate_chat_response(message: str, mode: str | None = None) -> str:
    return process_query(message, mode=mode)


def generate_chat_response_stream(message: str, mode: str | None = None):
    return process_query_stream(message, mode=mode)