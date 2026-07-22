"""Generación de reportes finales de misión (Markdown + PDF) — branding ARES."""
from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# backend/data/mission_reports
_REPORTS_DIR = Path(__file__).resolve().parents[2] / "data" / "mission_reports"

# repo_root/assets/branding/ares_logo.png
_REPO_ROOT = Path(__file__).resolve().parents[3]
LOGO_PATH = Path(
    os.environ.get(
        "ARES_LOGO_PATH",
        str(_REPO_ROOT / "assets" / "branding" / "ares_logo.png"),
    )
)

# Paleta cyberpunk rojiza (RGB 0-255)
ARES_RED = (255, 30, 45)
ARES_RED_MID = (200, 20, 35)
ARES_RED_DARK = (150, 12, 20)
ARES_RED_DEEP = (90, 8, 14)
ARES_BG = (12, 10, 11)
ARES_PANEL = (22, 18, 19)
ARES_PANEL_ALT = (32, 26, 28)
ARES_TEXT = (230, 225, 225)
ARES_TEXT_DIM = (150, 140, 142)
ARES_GREEN = (60, 220, 130)
ARES_YELLOW = (240, 190, 60)
ARES_WHITE = (255, 255, 255)


def _ensure_dir() -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    return _REPORTS_DIR


def _status_key(status: str | None) -> str:
    s = (status or "unknown").lower().strip()
    if s in ("success", "ok", "done", "completed"):
        return "success"
    if s in ("failed", "fail", "error"):
        return "failed"
    return s or "unknown"


def _normalize_output_text(text: str) -> str:
    """Reúne chunks de stream (1 token por línea) en texto horizontal legible.

    Runs antiguos guardaban cada token del LLM con un \\n forzado; eso
    produce PDFs con una letra/sílaba por renglón. Detectamos ese patrón y
    unimos. Los saltos de párrafo reales del modelo se conservan si las
    líneas son largas (comandos, logs, markdown).
    """
    if not text:
        return ""
    # Unificar saltos
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    if len(lines) < 8:
        return text.strip()

    nonempty = [ln for ln in lines if ln.strip() != ""]
    if len(nonempty) < 8:
        return text.strip()

    short = sum(1 for ln in nonempty if len(ln) <= 16)
    # >=60% líneas cortas → casi seguro stream tokenizado
    if short >= len(nonempty) * 0.6:
        return "".join(lines).strip()
    return text.strip()


def _collect_outputs(run: dict[str, Any]) -> dict[str, str]:
    outputs: dict[str, str] = {}
    raw = dict(run.get("outputs") or {})
    if raw:
        for k, v in raw.items():
            outputs[k] = _normalize_output_text(str(v) if v is not None else "")
        return outputs
    for step in run.get("steps") or []:
        sid = step.get("id")
        logs = step.get("logs") or []
        if sid and logs:
            # logs son chunks de stream: unir sin \\n extra
            outputs[sid] = _normalize_output_text("".join(str(x) for x in logs))
    return outputs


def _truncate(text: str, max_len: int) -> str:
    text = _normalize_output_text(text or "")
    if len(text) <= max_len:
        return text
    return text[:max_len] + "\n...[truncado en PDF, ver .md]..."


# ── MARKDOWN ────────────────────────────────────────────────────────────

def build_markdown(run: dict[str, Any], mission: dict[str, Any] | None = None) -> str:
    mission = mission or {}
    title = run.get("title") or mission.get("title") or run.get("mission_id") or "Misión"
    status = _status_key(run.get("status"))
    created = run.get("created_at") or ""
    finished = run.get("finished_at") or ""
    target = run.get("target") or "(lab interno / sin target externo)"
    tools = ", ".join(mission.get("tools") or []) or "—"
    category = mission.get("category") or "—"
    difficulty = mission.get("difficulty") or "—"
    subtitle = mission.get("subtitle") or ""
    description = mission.get("description") or ""
    badge = mission.get("badge") or ""

    status_badge = {
        "success": "🟢 **SUCCESS**",
        "failed": "🔴 **FAILED**",
    }.get(status, f"🟡 **{status.upper()}**")

    logo_block = f"![ARES]({LOGO_PATH.name})\n" if LOGO_PATH.exists() else ""

    lines: list[str] = [
        '<div align="center">',
        "",
        logo_block.rstrip(),
        "",
        "# A.R.E.S. // MISSION REPORT",
        "",
        "**Agente de Defensa Autónomo** — Reporte Final de Misión",
        "",
        "</div>",
        "",
        "---",
        "",
        f"## {title}",
        "",
    ]
    if subtitle:
        lines += [f"*{subtitle}*", ""]
    if badge:
        lines += [f"`{badge}`", ""]
    if description:
        lines += [description, ""]

    lines += [
        "| Campo | Valor |",
        "| :--- | :--- |",
        f"| **Estado** | {status_badge} |",
        f"| **Run ID** | `{run.get('id')}` |",
        f"| **Mission ID** | `{run.get('mission_id')}` |",
        f"| **Categoría** | {category} |",
        f"| **Dificultad** | {difficulty} |",
        f"| **Target** | `{target}` |",
        f"| **Herramientas** | {tools} |",
        f"| **Inicio** | {created} |",
        f"| **Fin** | {finished or '—'} |",
        f"| **Generado** | {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} |",
        "",
        "---",
        "",
        "## Resumen de pasos",
        "",
    ]

    steps = run.get("steps") or []
    if not steps:
        lines += ["_No se registraron pasos._", ""]
    else:
        lines += ["| # | Paso | Estado |", "| :---: | :--- | :---: |"]
        for i, step in enumerate(steps, 1):
            st = step.get("status") or "—"
            name = step.get("name") or step.get("id") or "—"
            mark = {
                "done": "🟢 done",
                "error": "🔴 error",
                "running": "🟡 running",
            }.get(st, f"⚪ {st}")
            lines.append(f"| {i:02d} | {name} | {mark} |")
        lines.append("")

    if run.get("error"):
        lines += ["## Error", "", "```diff", f"- {run['error']}", "```", ""]

    lines += ["## Evidencia por paso", ""]
    outputs = _collect_outputs(run)
    if not outputs:
        lines += ["_Sin salida capturada._", ""]
    else:
        for step in steps:
            sid = step.get("id")
            name = step.get("name") or sid
            body = (outputs.get(sid) or "").strip()
            if not body:
                continue
            if len(body) > 8000:
                body = body[:8000] + "\n\n...[truncado en reporte]..."
            icon = {"done": "🟢", "error": "🔴"}.get(step.get("status") or "", "⚪")
            lines += [f"### {icon} {name}", "", "```", body, "```", ""]

    if status == "success":
        conclusion = (
            "Misión completada con éxito. Revisar hallazgos, conservar este reporte "
            "como evidencia educativa y aplicar las remediaciones sugeridas."
        )
    else:
        conclusion = (
            "Misión finalizada con errores. Revisar el paso fallido, corregir el entorno "
            "(Docker, red, LLM) y reintentar."
        )

    lines += [
        "---",
        "",
        "## Conclusión",
        "",
        conclusion,
        "",
        "---",
        "",
        '<div align="center">',
        "",
        "**ARES Mission Builder** · uso educativo · IEU Universidad",
        "",
        "*CONFIDENCIAL — solo para fines de laboratorio*",
        "",
        "</div>",
        "",
    ]
    return "\n".join(lines)


def write_markdown(run: dict[str, Any], mission: dict[str, Any] | None = None) -> Path:
    md = build_markdown(run, mission)
    out_dir = _ensure_dir()
    path = out_dir / f"{run['id']}.md"
    path.write_text(md, encoding="utf-8")
    if LOGO_PATH.exists():
        try:
            dest = out_dir / LOGO_PATH.name
            if not dest.exists() or dest.stat().st_size != LOGO_PATH.stat().st_size:
                dest.write_bytes(LOGO_PATH.read_bytes())
        except OSError:
            pass
    return path


# ── PDF helpers ─────────────────────────────────────────────────────────

def _latin1(text: str) -> str:
    if text is None:
        return ""
    replacements = {
        "✔": "[OK]", "✖": "[X]",
        "🟢": "[OK]", "🔴": "[FAIL]", "🟡": "[...]", "⚪": "[-]",
        "✅": "[OK]", "⚠️": "[!]", "⚠": "[!]",
        "▓": "#", "▸": ">",
        "—": "-", "–": "-", "·": "-",
        "“": '"', "”": '"', "‘": "'", "’": "'",
        "…": "...", "→": "->", "←": "<-", "×": "x",
        "\u00a0": " ",
    }
    out = str(text)
    for a, b in replacements.items():
        out = out.replace(a, b)
    out = re.sub(r"[#*_`]+", "", out)
    return out.encode("latin-1", errors="replace").decode("latin-1")


def write_pdf(
    run: dict[str, Any],
    markdown_text: str | None = None,
    mission: dict[str, Any] | None = None,
) -> Path:
    """PDF con branding ARES cyberpunk. Fallback mínimo si fpdf2 falla."""
    path = _ensure_dir() / f"{run['id']}.pdf"
    title = run.get("title") or run.get("mission_id") or "ARES Mission Report"
    mission = mission or {}

    try:
        return _write_pdf_fpdf(path, run, mission, title)
    except Exception as exc:
        logger.warning("fpdf2 report failed, using minimal PDF: %s", exc)
        md = markdown_text or build_markdown(run, mission)
        path.write_bytes(_minimal_pdf(title, md[:3500], _status_key(run.get("status"))))
        return path


def _write_pdf_fpdf(path: Path, run: dict[str, Any], mission: dict[str, Any], title: str) -> Path:
    from fpdf import FPDF

    class AresPDF(FPDF):
        def __init__(self) -> None:
            super().__init__()
            self.set_margins(14, 34, 14)
            self.set_auto_page_break(auto=True, margin=22)

        def header(self) -> None:
            self.set_fill_color(*ARES_BG)
            self.rect(0, 0, self.w, self.h, "F")

            # Top bar (solo branding visual + logo; sin texto extra)
            self.set_fill_color(*ARES_RED_DEEP)
            self.rect(0, 0, self.w, 26, "F")
            self.set_fill_color(*ARES_RED)
            self.rect(0, 26, self.w, 1.4, "F")

            if LOGO_PATH.exists():
                try:
                    # Logo centrado horizontalmente
                    logo_h = 14
                    logo_w = 52  # ancho aproximado del wordmark ARES
                    lx = (self.w - logo_w) / 2
                    self.image(str(LOGO_PATH), x=lx, y=6, h=logo_h)
                except Exception:
                    pass

            self.set_y(32)
            self.set_text_color(*ARES_TEXT)

        def footer(self) -> None:
            self.set_y(-18)
            self.set_draw_color(*ARES_RED_DARK)
            self.set_line_width(0.4)
            self.line(14, self.get_y(), self.w - 14, self.get_y())
            self.set_y(-14)
            self.set_font("Helvetica", "", 7)
            self.set_text_color(*ARES_RED_DARK)
            self.cell(
                0,
                6,
                _latin1(f"ARES // CONFIDENCIAL  -  pagina {self.page_no()}/{{nb}}  -  uso educativo"),
                align="C",
            )

        def section(self, label: str) -> None:
            self.ln(4)
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(*ARES_RED)
            self.set_draw_color(*ARES_RED)
            self.set_line_width(0.35)
            self.cell(0, 7, f"  {label.upper()}", border="B", new_x="LMARGIN", new_y="NEXT")
            self.ln(3)
            self.set_text_color(*ARES_TEXT)

        def kv(self, key: str, value: str) -> None:
            key_w = 38
            usable = self.epw
            val_w = max(20, usable - key_w)
            y = self.get_y()
            self.set_xy(self.l_margin, y)
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(*ARES_RED_MID)
            self.cell(key_w, 5.5, _latin1(key), new_x="RIGHT", new_y="TOP")
            self.set_font("Helvetica", "", 8)
            self.set_text_color(*ARES_TEXT)
            self.multi_cell(val_w, 5.5, _latin1(value or "-"))

        def terminal(self, header: str, body: str, ok: bool = True) -> None:
            # Texto horizontal (reflow de chunks + wrap natural de multi_cell)
            body = _truncate(body, 3500)
            usable = self.epw

            if self.get_y() > self.h - 40:
                self.add_page()

            self.set_fill_color(*ARES_PANEL_ALT)
            self.set_draw_color(*ARES_RED_DARK)
            self.set_line_width(0.25)
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(*ARES_RED)
            self.cell(usable, 6, _latin1(f"  > {header}"), border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

            # Helvetica wrappea mejor en prosa que Courier monospaced estrecho
            self.set_font("Helvetica", "", 8)
            text = _latin1(body) if body else " "
            # multi_cell con ancho completo = flujo horizontal como la UI
            self.set_fill_color(*ARES_PANEL)
            self.set_text_color(*(ARES_GREEN if ok else ARES_RED))
            self.set_draw_color(*ARES_RED_DEEP)
            self.multi_cell(usable, 4.2, text, border=1, fill=True, align="L")
            self.ln(3)
            self.set_text_color(*ARES_TEXT)

    pdf = AresPDF()
    pdf.alias_nb_pages()
    pdf.add_page()

    status = _status_key(run.get("status"))
    created = run.get("created_at") or "-"
    finished = run.get("finished_at") or "-"
    target = run.get("target") or "(lab interno / sin target externo)"
    tools = ", ".join(mission.get("tools") or []) or "-"
    category = mission.get("category") or "-"
    difficulty = mission.get("difficulty") or "-"
    subtitle = mission.get("subtitle") or ""

    # Title card
    usable = pdf.epw
    x0 = pdf.l_margin
    y0 = pdf.get_y()
    card_h = 20 if subtitle else 14
    pdf.set_fill_color(*ARES_PANEL)
    pdf.set_draw_color(*ARES_RED_DARK)
    pdf.set_line_width(0.4)
    pdf.rect(x0, y0, usable, card_h, style="FD")
    pdf.set_xy(x0 + 4, y0 + 3)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*ARES_TEXT)
    pdf.cell(usable - 8, 6, _latin1(title), new_x="LMARGIN", new_y="NEXT")
    if subtitle:
        pdf.set_xy(x0 + 4, y0 + 10)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(*ARES_TEXT_DIM)
        pdf.cell(usable - 8, 5, _latin1(subtitle), new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(y0 + card_h + 4)

    # Status badge
    if status == "success":
        badge_rgb, badge_txt = ARES_GREEN, "[ SUCCESS ]"
    elif status == "failed":
        badge_rgb, badge_txt = ARES_RED, "[ FAILED ]"
    else:
        badge_rgb, badge_txt = ARES_YELLOW, f"[ {status.upper()} ]"
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*badge_rgb)
    pdf.cell(0, 6, badge_txt, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)

    # Metadata
    pdf.section("Metadata")
    pdf.kv("RUN ID", str(run.get("id") or "-"))
    pdf.kv("MISSION ID", str(run.get("mission_id") or "-"))
    pdf.kv("CATEGORIA", str(category))
    pdf.kv("DIFICULTAD", str(difficulty))
    pdf.kv("TARGET", str(target))
    pdf.kv("HERRAMIENTAS", str(tools))
    pdf.kv("INICIO", str(created))
    pdf.kv("FIN", str(finished))
    pdf.kv("GENERADO", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))

    # Steps
    steps = run.get("steps") or []
    pdf.section("Resumen de pasos")
    if not steps:
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(*ARES_TEXT_DIM)
        pdf.multi_cell(pdf.epw, 5, "No se registraron pasos.")
        pdf.set_text_color(*ARES_TEXT)
    else:
        for i, step in enumerate(steps, 1):
            st = step.get("status") or "-"
            name = step.get("name") or step.get("id") or "-"
            if st == "done":
                col, tag = ARES_GREEN, "DONE"
            elif st == "error":
                col, tag = ARES_RED, "ERROR"
            else:
                col, tag = ARES_YELLOW, (st.upper()[:8] or "....")
            tag_w = 28
            pdf.set_font("Courier", "B", 8)
            pdf.set_text_color(*col)
            pdf.cell(tag_w, 5.5, f"{i:02d} [{tag}]", new_x="RIGHT", new_y="TOP")
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(*ARES_TEXT)
            pdf.multi_cell(max(20, pdf.epw - tag_w), 5.5, _latin1(str(name)))

    if run.get("error"):
        pdf.section("Error")
        pdf.terminal("stderr", str(run["error"]), ok=False)

    # Evidence
    outputs = _collect_outputs(run)
    if outputs:
        pdf.section("Evidencia por paso")
        for step in steps:
            sid = step.get("id")
            name = step.get("name") or sid or "paso"
            body = (outputs.get(sid) or "").strip()
            if not body:
                continue
            ok = (step.get("status") or "") != "error"
            pdf.terminal(str(name), body, ok=ok)

    # Conclusion
    pdf.section("Conclusion")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*ARES_TEXT)
    if status == "success":
        conclusion = (
            "Mision completada con exito. Revisar hallazgos, conservar este reporte "
            "como evidencia educativa y aplicar las remediaciones sugeridas."
        )
    else:
        conclusion = (
            "Mision finalizada con errores. Revisar el paso fallido, verificar Docker/LLM "
            "y reintentar la ejecucion."
        )
    pdf.multi_cell(pdf.epw, 5.5, _latin1(conclusion))
    pdf.ln(6)

    # Brand footer block
    pdf.set_draw_color(*ARES_RED)
    pdf.set_line_width(0.6)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*ARES_RED)
    pdf.cell(0, 5, "ARES MISSION BUILDER", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(*ARES_TEXT_DIM)
    pdf.cell(0, 4, _latin1("IEU Universidad  -  uso educativo  -  confidencial"), align="C")

    pdf.output(str(path))
    return path


def _minimal_pdf(title: str, body: str, status: str = "unknown") -> bytes:
    """PDF 1.4 mínimo sin dependencias, acento rojo ARES."""

    def esc(s: str) -> str:
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    body_lines = [esc(_latin1(l))[:95] for l in body.splitlines()[:75]]
    parts = [
        "BT", "/F1 14 Tf", "1 0.12 0.18 rg",
        "50 780 Td", f"(ARES // {esc(_latin1(title))[:60]}) Tj", "ET",
        "BT", "/F1 8 Tf", "0.7 0.7 0.7 rg",
        "50 762 Td", f"([{esc(status.upper())}]) Tj", "ET",
        "BT", "/F1 9 Tf", "0.9 0.9 0.9 rg", "14 TL", "50 745 Td",
    ]
    for i, line in enumerate(body_lines):
        if i == 0:
            parts.append(f"({line}) Tj")
        else:
            parts.extend(["T*", f"({line}) Tj"])
    parts.append("ET")
    stream = "\n".join(parts).encode("latin-1", errors="replace")

    objs: list[bytes] = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
        ),
        f"4 0 obj<< /Length {len(stream)} >>stream\n".encode("ascii")
        + stream
        + b"\nendstream\nendobj\n",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objs:
        offsets.append(len(out))
        out.extend(obj)
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    out.extend(
        f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
    )
    return bytes(out)


def generate_reports(run: dict[str, Any], mission: dict[str, Any] | None = None) -> dict[str, str]:
    md_path = write_markdown(run, mission)
    md_text = md_path.read_text(encoding="utf-8")
    pdf_path = write_pdf(run, md_text, mission=mission)
    return {
        "report_md_path": str(md_path),
        "report_pdf_path": str(pdf_path),
        "report_md": md_path.name,
        "report_pdf": pdf_path.name,
    }
