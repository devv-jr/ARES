from pathlib import Path
import sys

_REPO_ROOT = str(Path(__file__).resolve().parents[3])
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from agent.core.step_executor import execute_pipeline
from agent.core.prompt_engine import list_prompts


def run_pipeline(prompt_id: str):
    yield from execute_pipeline(prompt_id)


def get_available_prompts():
    return list_prompts()
