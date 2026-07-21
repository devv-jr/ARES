"""
Mission Builder API — capa de producto sobre playbooks.

Endpoints listos para que el frontend monte UI sin conocer
detalles internos del motor de playbooks.

Montaje:
    from app.api.missions import router as missions_router
    app.include_router(missions_router)
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse, StreamingResponse
from pydantic import BaseModel, Field

from agent.core.audit import audit
from agent.playbooks import list_playbooks, get_playbook, run_playbook
from agent.playbooks.loader import PlaybookNotFoundError
from app.services import mission_run_store as run_store
from app.services.mission_report import generate_reports, build_markdown

router = APIRouter(prefix="/missions", tags=["missions"])


class RunMissionRequest(BaseModel):
    """target opcional: misiones con lab interno no lo necesitan."""
    target: str = ""
    mode: str | None = Field(default=None, max_length=50)


def _mission_payload(pb) -> dict:
    data = pb.model_dump()
    data["mission_id"] = pb.id
    data["kind"] = "mission"
    return data


@router.get("")
async def list_missions():
    """Catálogo de misiones (playbooks) para Mission Builder."""
    items = [_mission_payload(pb) for pb in list_playbooks()]
    # Orden estable: misiones nuevas primero por id conocido, resto al final
    priority = [
        "hardening_linux",
        "owasp_web_audit",
        "linux_log_analysis",
        "malware_investigation",
        "pcap_analysis",
        "port_sweep",
    ]
    rank = {mid: i for i, mid in enumerate(priority)}
    items.sort(key=lambda m: rank.get(m["id"], 100))
    return items


@router.get("/runs")
async def list_mission_runs(
    limit: int = Query(default=50, ge=1, le=200),
    mission_id: str | None = None,
):
    """Historial de ejecuciones (para Evidencias / UI de runs)."""
    return run_store.list_runs(limit=limit, mission_id=mission_id)


@router.get("/runs/{run_id}")
async def get_mission_run(run_id: str):
    run = run_store.load_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run no encontrado")
    return run


@router.get("/runs/{run_id}/report.md")
async def get_run_report_md(run_id: str):
    run = run_store.load_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run no encontrado")

    md_path = run.get("report_md_path")
    if md_path and Path(md_path).is_file():
        return FileResponse(
            md_path,
            media_type="text/markdown; charset=utf-8",
            filename=f"ares-mission-{run_id}.md",
        )

    # Generar al vuelo si aún no existe archivo
    mission = None
    try:
        mission = get_playbook(run["mission_id"]).model_dump()
    except Exception:
        pass
    md = build_markdown(run, mission)
    return PlainTextResponse(md, media_type="text/markdown; charset=utf-8")


@router.get("/runs/{run_id}/report.pdf")
async def get_run_report_pdf(run_id: str):
    run = run_store.load_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run no encontrado")

    pdf_path = run.get("report_pdf_path")
    if not pdf_path or not Path(pdf_path).is_file():
        # Intentar generar si falta
        mission = None
        try:
            mission = get_playbook(run["mission_id"]).model_dump()
        except Exception:
            pass
        try:
            paths = generate_reports(run, mission)
            run.update(paths)
            run_store.save_run(run)
            pdf_path = run.get("report_pdf_path")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"No se pudo generar PDF: {exc}") from exc

    if not pdf_path or not Path(pdf_path).is_file():
        raise HTTPException(status_code=404, detail="Reporte PDF no disponible")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"ares-mission-{run_id}.pdf",
    )


@router.get("/{mission_id}")
async def get_mission(mission_id: str):
    """Detalle de una misión (pasos, lab, metadata)."""
    try:
        return _mission_payload(get_playbook(mission_id))
    except PlaybookNotFoundError:
        raise HTTPException(status_code=404, detail="Misión no encontrada")


@router.post("/{mission_id}/run")
async def run_mission(mission_id: str, body: RunMissionRequest | None = None):
    """
    Ejecuta la misión y transmite eventos por SSE.
    Emite run_meta al inicio con run_id. Al finalizar genera reporte MD/PDF
    y registra evidencias en el audit log.
    """
    body = body or RunMissionRequest()
    try:
        playbook = get_playbook(mission_id)
    except PlaybookNotFoundError:
        audit.error("playbook_error", "api", f"Misión no encontrada: {mission_id}")
        raise HTTPException(status_code=404, detail="Misión no encontrada")

    if playbook.requires_target and not (body.target or "").strip():
        raise HTTPException(
            status_code=422,
            detail="Esta misión requiere un target (IP/URL)",
        )

    run = run_store.create_run(
        mission_id=mission_id,
        title=playbook.title,
        target=body.target or "",
        mode=body.mode,
    )
    run_id = run["id"]

    audit.info(
        "playbook_start",
        "api",
        f"Misión '{playbook.title}' iniciada (run {run_id[:8]}…)",
        {
            "mission_id": mission_id,
            "run_id": run_id,
            "target": body.target or None,
            "mode": body.mode,
            "mission": True,
        },
    )

    async def event_stream():
        final_status = "failed"
        try:
            async for event in run_playbook(
                mission_id,
                body.target or "",
                run_id=run_id,
            ):
                payload = event.model_dump()
                run_store.append_event(run_id, payload)
                if event.type == "playbook_end":
                    final_status = "success" if event.data == "success" else "failed"
                yield f"data: {json.dumps(payload)}\n\n"
        except Exception as exc:
            audit.error(
                "playbook_error",
                "api",
                f"Error ejecutando misión {mission_id}: {exc}",
                {"mission_id": mission_id, "run_id": run_id},
            )
            err_event = {
                "type": "error",
                "step_id": None,
                "step_name": None,
                "data": str(exc),
                "timestamp": run_store._now(),
            }
            run_store.append_event(run_id, err_event)
            yield f"data: {json.dumps(err_event)}\n\n"
            fail_event = {
                "type": "playbook_end",
                "step_id": None,
                "step_name": None,
                "data": "failed",
                "timestamp": run_store._now(),
            }
            run_store.append_event(run_id, fail_event)
            yield f"data: {json.dumps(fail_event)}\n\n"
            final_status = "failed"
        finally:
            # Generar reporte y adjuntar paths al run
            finished = run_store.load_run(run_id)
            if finished:
                try:
                    paths = generate_reports(finished, playbook.model_dump())
                    finished.update(paths)
                    finished["status"] = final_status
                    run_store.save_run(finished)
                    audit.info(
                        "playbook_end",
                        "api",
                        f"Reporte de misión generado: {run_id[:8]}… ({final_status})",
                        {
                            "mission_id": mission_id,
                            "run_id": run_id,
                            "status": final_status,
                            "report_md": paths.get("report_md"),
                            "report_pdf": paths.get("report_pdf"),
                            "mission": True,
                        },
                    )
                    meta = {
                        "type": "run_meta",
                        "step_id": None,
                        "step_name": None,
                        "data": {
                            "run_id": run_id,
                            "status": final_status,
                            "report_md": f"/missions/runs/{run_id}/report.md",
                            "report_pdf": f"/missions/runs/{run_id}/report.pdf",
                        },
                        "timestamp": run_store._now(),
                    }
                    yield f"data: {json.dumps(meta)}\n\n"
                except Exception as rep_exc:
                    audit.warn(
                        "playbook_error",
                        "api",
                        f"No se pudo generar reporte: {rep_exc}",
                        {"run_id": run_id},
                    )
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
