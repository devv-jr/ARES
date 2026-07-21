"""Persistencia de ejecuciones de misiones (Mission Builder).

Guarda corridas en backend/data/mission_runs/ como JSON.
Compatible con generación de reportes MD/PDF.
"""
from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "mission_runs"
_lock = threading.Lock()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_dir() -> Path:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    return _DATA_DIR


def _path(run_id: str) -> Path:
    safe = run_id.replace("..", "").replace("/", "").replace("\\", "")
    return _ensure_dir() / f"{safe}.json"


def new_run_id() -> str:
    return str(uuid.uuid4())


def create_run(
    *,
    mission_id: str,
    title: str,
    target: str = "",
    mode: str | None = None,
) -> dict[str, Any]:
    run = {
        "id": new_run_id(),
        "mission_id": mission_id,
        "title": title,
        "target": target or None,
        "mode": mode,
        "status": "running",
        "created_at": _now(),
        "updated_at": _now(),
        "finished_at": None,
        "steps": [],
        "events": [],
        "outputs": {},
        "error": None,
        "report_md_path": None,
        "report_pdf_path": None,
    }
    save_run(run)
    return run


def save_run(run: dict[str, Any]) -> dict[str, Any]:
    run["updated_at"] = _now()
    path = _path(run["id"])
    with _lock:
        path.write_text(json.dumps(run, ensure_ascii=False, indent=2), encoding="utf-8")
    return run


def load_run(run_id: str) -> dict[str, Any] | None:
    path = _path(run_id)
    if not path.is_file():
        return None
    with _lock:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None


def list_runs(limit: int = 50, mission_id: str | None = None) -> list[dict[str, Any]]:
    directory = _ensure_dir()
    items: list[dict[str, Any]] = []
    with _lock:
        files = sorted(directory.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        for path in files:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
            if mission_id and data.get("mission_id") != mission_id:
                continue
            items.append(
                {
                    "id": data.get("id"),
                    "mission_id": data.get("mission_id"),
                    "title": data.get("title"),
                    "status": data.get("status"),
                    "created_at": data.get("created_at"),
                    "finished_at": data.get("finished_at"),
                    "target": data.get("target"),
                    "has_report": bool(data.get("report_md_path")),
                }
            )
            if len(items) >= limit:
                break
    return items


def append_event(run_id: str, event: dict[str, Any]) -> dict[str, Any] | None:
    run = load_run(run_id)
    if run is None:
        return None

    run.setdefault("events", []).append(event)
    etype = event.get("type")
    step_id = event.get("step_id")

    if etype == "step_start" and step_id:
        steps = run.setdefault("steps", [])
        if not any(s.get("id") == step_id for s in steps):
            steps.append(
                {
                    "id": step_id,
                    "name": event.get("step_name") or step_id,
                    "status": "running",
                    "logs": [],
                }
            )
        else:
            for s in steps:
                if s.get("id") == step_id:
                    s["status"] = "running"

    elif etype == "step_output" and step_id:
        line = event.get("data")
        if line is not None:
            text = line if isinstance(line, str) else json.dumps(line, ensure_ascii=False)
            for s in run.setdefault("steps", []):
                if s.get("id") == step_id:
                    s.setdefault("logs", []).append(text)
                    break
            outs = run.setdefault("outputs", {})
            outs[step_id] = (outs.get(step_id) or "") + text + "\n"

    elif etype == "step_end" and step_id:
        for s in run.setdefault("steps", []):
            if s.get("id") == step_id:
                s["status"] = "done"
                break

    elif etype == "error":
        run["error"] = event.get("data")
        if step_id:
            for s in run.setdefault("steps", []):
                if s.get("id") == step_id:
                    s["status"] = "error"
                    s["error"] = event.get("data")
                    break

    elif etype == "playbook_end":
        status = event.get("data")
        run["status"] = "success" if status == "success" else "failed"
        run["finished_at"] = _now()

    return save_run(run)
