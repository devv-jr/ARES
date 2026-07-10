from pathlib import Path
import sys


REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from agent.core.knowledge_base import get_categories, get_content


def list_categories():
    return get_categories()


def get_category_content(category_id: str, subcategory_id: str):
    return get_content(category_id, subcategory_id)
