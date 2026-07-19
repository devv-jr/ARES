"""
Carga y valida los playbooks definidos en agent/playbooks/definitions/*.json
"""
import json
from pathlib import Path
from functools import lru_cache

from .models import PlaybookDefinition

DEFINITIONS_DIR = Path(__file__).parent / "definitions"


class PlaybookNotFoundError(Exception):
    pass


@lru_cache(maxsize=1)
def _load_all() -> dict[str, PlaybookDefinition]:
    playbooks: dict[str, PlaybookDefinition] = {}
    for json_file in DEFINITIONS_DIR.glob("*.json"):
        try:
            raw = json.loads(json_file.read_text(encoding="utf-8"))
            pb = PlaybookDefinition(**raw)
            playbooks[pb.id] = pb
        except Exception as e:
            # No tumbamos todo el sistema si un playbook está mal formado
            print(f"[playbooks] Error cargando {json_file.name}: {e}")
    return playbooks


def list_playbooks() -> list[PlaybookDefinition]:
    return list(_load_all().values())


def get_playbook(playbook_id: str) -> PlaybookDefinition:
    playbooks = _load_all()
    if playbook_id not in playbooks:
        raise PlaybookNotFoundError(f"Playbook '{playbook_id}' no encontrado")
    return playbooks[playbook_id]


def reload_playbooks() -> None:
    """Útil en desarrollo si editas los JSON sin reiniciar el server."""
    _load_all.cache_clear()
