"""Generación de reportes finales de misión (Markdown + PDF) — branding ARES."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPORTS_DIR = Path(__file__).resolve().parents[2] / "data" / "mission_reports"

# ── Branding ARES ────────────────────────────────────────────────────────
LOGO_PATH = Path(
    os.environ.get(
        "ARES_LOGO_PATH",
        str(Path(__file__).resolve().parents[2] / "assets" / "branding" / "ares_logo.png"),
    )
)

# Paleta cyberpunk rojiza (RGB)
ARES_RED = (255, 30, 45)          # rojo neón principal
ARES_RED_DARK = (150, 12, 20)     # rojo apagado (líneas secundarias)
ARES_RED_DEEP = (90, 8, 14)       # rojo casi sangre (rellenos sutiles)
ARES_BG = (12, 10, 11)            # fondo casi negro
ARES_PANEL = (24, 20, 21)         # paneles/cajas sobre el fondo
ARES_TEXT = (225, 220, 220)       # texto claro
ARES_TEXT_DIM = (150, 140, 140)   # texto secundario
ARES_GREEN = (60, 220, 130)       # estado success
ARES_YELLOW = (240, 190, 60)      # estado en progreso / warning


def _ensure_dir() -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    return _REPORTS_DIR


# ── MARKDOWN ────────────────────────────────────────────────────────────
def build_markdown(run: dict[str, Any], mission: dict[str, Any] | None = None) -> str:
    mission = mission or {}
    title = run.get("title") or mission.get("title") or run.get("mission_id") or "Misión"
    status = run.get("status") or "unknown"
    created = run.get("created_at") or ""
    finished = run.get("finished_at") or ""
    target = run.get("target") or "(lab interno / sin target externo)"
    tools = ", ".join(mission.get("tools") or []) or "—"
    category = mission.get("category") or "—"
    difficulty = mission.get("difficulty") or "—"

    status_badge = {
        "success": "🟢 `SUCCESS`",
        "error": "🔴 `ERROR`",
    }.get(status, f"🟡 `{status.upper()}`")

    logo_md = (
        f'<img src="{LOGO_PATH.name}" alt="ARES" height="48" />\n\n'
        if LOGO_PATH.exists()
        else ""
    )

    lines = [
        '<div align="center">',
        "",
        logo_md.strip(),
        "",
        '<h1 style="color:#FF1E2D;letter-spacing:2px;">A.R.E.S. // MISSION REPORT</h1>',
        '<p style="color:#961014;">Agente de Defensa Autónomo — Reporte Final de Misión</p>',
        "",
        "</div>",
        "",
        "---",
        "",
        f"## ▓▓ {title}",
        "",
        f"| Campo | Valor |",
        f"|---|---|",
        f"| **Estado** | {status_badge} |",
        f"| **Run ID** | `{run.get('id')}` |",
        f"| **Mission ID** | `{run.get('mission_id')}` |",
        f"| **Categoría** | {category} |",
        f"| **Dificultad** | {difficulty} |",
        f"| **Target** | {target} |",
        f"| **Herramientas** | {tools} |",
        f"| **Inicio** | {created} |",
        f"| **Fin** | {finished or '—'} |",
        f"| **Generado** | {datetime.now(timezone.utc).isoformat()} |",
        "",
        "---",
        "",
        "## ▓▓ Resumen de pasos",
        "",
    ]

    steps = run.get("steps") or []
    if not steps:
        lines.append("_No se registraron pasos._")
        lines.append("")
    else:
        lines.append("| # | Paso | Estado |")
        lines.append("|---|------|--------|")
        for i, step in enumerate(steps, 1):
            st = step.get("status") or "—"
            name = step.get("name") or step.get("id") or "—"
            mark = {"done": "🟢", "error": "🔴"}.get(st, "🟡")
            lines.append(f"| {i:02d} | {name} | {mark} `{st}` |")
        lines.append("")

    if run.get("error"):
        lines.extend(["## ▓▓ Error", "", "```diff", f"- {run['error']}", "```", ""])

    lines.extend(["## ▓▓ Evidencia por paso", ""])
    outputs = run.get("outputs") or {}
    if not outputs and steps:
        for step in steps:
            sid = step.get("id")
            logs = step.get("logs") or []
            if logs:
                outputs[sid] = "\n".join(logs)

    if not outputs:
        lines.append("_Sin salida capturada._")
        lines.append("")
    else:
        for step in steps:
            sid = step.get("id")
            name = step.get("name") or sid
            body = (outputs.get(sid) or "").strip()
            if not body:
                continue
            if len(body) > 8000:
                body = body[:8000] + "\n\n...[truncado en reporte]..."
            lines.append(f"### ▸ {name}")
            lines.append("")
            lines.append("```")
            lines.append(body)
            lines.append("```")
            lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## ▓▓ Conclusión",
            "",
            (
                "✅ Misión completada. Revisar hallazgos anteriores y adjuntar este reporte "
                "a Evidencias / caso de uso educativo."
                if status == "success"
                else "⚠️ Misión finalizada con errores. Revisar el paso fallido y reintentar."
            ),
            "",
            '<p align="center" style="color:#961014;">',
            "Generado por <strong>ARES Mission Builder</strong> — uso educativo",
            "</p>",
            "",
        ]
    )
    return "\n".join(lines)


def write_markdown(run: dict[str, Any], mission: dict[str, Any] | None = None) -> Path:
    md = build_markdown(run, mission)
    out_dir = _ensure_dir()
    path = out_dir / f"{run['id']}.md"
    path.write_text(md, encoding="utf-8")
    # Copia el logo junto al .md para que la ruta relativa <img src="..."> funcione
    if LOGO_PATH.exists():
        try:
            dest = out_dir / LOGO_PATH.name
            if not dest.exists():
                dest.write_bytes(LOGO_PATH.read_bytes())
        except Exception:
            pass
    return path


# ── PDF ─────────────────────────────────────────────────────────────────
def _latin1(text: str) -> str:
    return (
        text.replace("✔", "[OK]")
        .replace("✖", "[X]")
        .replace("🟢", "[OK]")
        .replace("🔴", "[FAIL]")
        .replace("🟡", "[...]")
        .replace("✅", "[OK]")
        .replace("⚠️", "[!]")
        .replace("▓", "#")
        .replace("▸", ">")
        .replace("—", "-")
        .replace("·", "-")
        .encode("latin-1", errors="replace")
        .decode("latin-1")
    )


def write_pdf(run: dict[str, Any], markdown_text: str | None = None) -> Path:
    """Genera PDF con branding ARES. Usa fpdf2 si está instalado; si no, PDF mínimo válido."""
    path = _ensure_dir() / f"{run['id']}.pdf"
    title = run.get("title") or run.get("mission_id") or "ARES Mission Report"

    try:
        from fpdf import FPDF

        class _AresPDF(FPDF):
            def header(self):
                # fondo oscuro en toda la página
                self.set_fill_color(*ARES_BG)
                self.rect(0, 0, self.w, self.h, "F")

                if LOGO_PATH.exists():
                    try:
                        self.image(str(LOGO_PATH), x=12, y=9, w=26)
                    except Exception:
                        pass

                self.set_xy(0, 12)
                self.set_font("Courier", "B", 15)
                self.set_text_color(*ARES_RED)
                self.cell(0, 8, _latin1("A.R.E.S. // MISSION REPORT"), align="C", new_x="LMARGIN", new_y="NEXT")

                self.set_font("Courier", "", 8)
                self.set_text_color(*ARES_TEXT_DIM)
                self.cell(0, 5, _latin1("AGENTE DE DEFENSA AUTONOMO"), align="C", new_x="LMARGIN", new_y="NEXT")

                self.set_draw_color(*ARES_RED)
                self.set_line_width(0.6)
                self.line(12, 26, self.w - 12, 26)
                self.set_y(32)
                self.set_text_color(*ARES_TEXT)

            def footer(self):
                self.set_y(-16)
                self.set_draw_color(*ARES_RED_DARK)
                self.set_line_width(0.3)
                self.line(12, self.get_y(), self.w - 12, self.get_y())
                self.set_font("Courier", "", 7)
                self.set_text_color(*ARES_RED_DARK)
                self.cell(0, 8, _latin1(f"ARES // CONFIDENCIAL -- pagina {self.page_no()}"), align="C")

            def section_title(self, text: str):
                self.ln(2)
                self.set_font("Courier", "B", 11)
                self.set_text_color(*ARES_RED)
                self.cell(0, 7, _latin1(f"## {text}"), new_x="LMARGIN", new_y="NEXT")
                self.set_draw_color(*ARES_RED_DEEP)
                self.set_line_width(0.3)
                self.line(12, self.get_y(), self.w - 12, self.get_y())
                self.ln(3)
                self.set_text_color(*ARES_TEXT)

            def kv_row(self, key: str, value: str):
                self.set_font("Courier", "B", 9)
                self.set_text_color(*ARES_RED_DARK)
                self.cell(38, 6, _latin1(key), new_x="RIGHT", new_y="TOP")
                self.set_font("Courier", "", 9)
                self.set_text_color(*ARES_TEXT)
                self.multi_cell(0, 6, _latin1(value))

            def terminal_block(self, header_text: str, body: str, ok: bool = True):
                self.set_font("Courier", "B", 9)
                self.set_text_color(*ARES_TEXT)
                self.cell(0, 6, _latin1(f"> {header_text}"), new_x="LMARGIN", new_y="NEXT")

                x0, y0 = self.get_x(), self.get_y()
                self.set_font("Courier", "", 7.5)
                self.set_text_color(*(ARES_GREEN if ok else ARES_RED))
                self.set_fill_color(*ARES_PANEL)
                self.set_draw_color(*(ARES_RED_DARK))
                self.set_line_width(0.3)

                # medir alto necesario dibujando en un cell temporal
                lines_count = self.multi_cell(
                    0, 4, _latin1(body), border=0, dry_run=True, output="LINES"
                )
                box_h = max(8, len(lines_count) * 4 + 4)

                self.set_xy(x0, y0)
                self.rect(x0, y0, self.w - 2 * x0, box_h, style="DF")
                self.set_xy(x0 + 2, y0 + 2)
                self.multi_cell(self.w - 2 * x0 - 4, 4, _latin1(body))
                self.set_y(y0 + box_h + 4)
                self.set_text_color(*ARES_TEXT)

        pdf = _AresPDF()
        pdf.set_auto_page_break(auto=True, margin=20)
        pdf.add_page()

        status = run.get("status") or "unknown"
        mission = None  # generate_reports pasa mission por separado a build_markdown
        created = run.get("created_at") or ""
        finished = run.get("finished_at") or ""
        target = run.get("target") or "(lab interno / sin target externo)"

        # Título de misión
        pdf.set_font("Courier", "B", 13)
        pdf.set_text_color(*ARES_TEXT)
        pdf.multi_cell(0, 7, _latin1(title))
        pdf.ln(1)

        # Badge de estado
        badge_color = ARES_GREEN if status == "success" else (ARES_RED if status == "error" else ARES_YELLOW)
        pdf.set_font("Courier", "B", 9)
        pdf.set_text_color(*badge_color)
        pdf.cell(0, 6, _latin1(f"[ {status.upper()} ]"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        # Metadata panel
        pdf.section_title("METADATA")
        pdf.kv_row("RUN ID:", str(run.get("id")))
        pdf.kv_row("MISSION ID:", str(run.get("mission_id")))
        pdf.kv_row("TARGET:", target)
        pdf.kv_row("INICIO:", created)
        pdf.kv_row("FIN:", finished or "-")
        pdf.kv_row("GENERADO:", datetime.now(timezone.utc).isoformat())
        pdf.ln(2)

        # Pasos
        steps = run.get("steps") or []
        pdf.section_title("RESUMEN DE PASOS")
        if not steps:
            pdf.set_font("Courier", "", 9)
            pdf.multi_cell(0, 6, _latin1("No se registraron pasos."))
        else:
            for i, step in enumerate(steps, 1):
                st = step.get("status") or "-"
                name = step.get("name") or step.get("id") or "-"
                color = ARES_GREEN if st == "done" else (ARES_RED if st == "error" else ARES_YELLOW)
                pdf.set_font("Courier", "", 9)
                pdf.set_text_color(*ARES_TEXT)
                pdf.cell(10, 6, _latin1(f"{i:02d}"), border=0)
                pdf.set_text_color(*color)
                pdf.cell(0, 6, _latin1(f"[{st.upper():^8}] {name}"), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(*ARES_TEXT)
        pdf.ln(2)

        if run.get("error"):
            pdf.section_title("ERROR")
            pdf.terminal_block("stderr", str(run["error"]), ok=False)

        # Evidencia
        outputs = run.get("outputs") or {}
        if not outputs and steps:
            for step in steps:
                sid = step.get("id")
                logs = step.get("logs") or []
                if logs:
                    outputs[sid] = "\n".join(logs)

        if outputs:
            pdf.section_title("EVIDENCIA POR PASO")
            for step in steps:
                sid = step.get("id")
                name = step.get("name") or sid
                body = (outputs.get(sid) or "").strip()
                if not body:
                    continue
                if len(body) > 4000:
                    body = body[:4000] + "\n...[truncado en PDF, ver .md]..."
                ok = (step.get("status") or "") != "error"
                pdf.terminal_block(name, body, ok=ok)

        # Conclusión
        pdf.section_title("CONCLUSION")
        pdf.set_font("Courier", "", 9)
        pdf.set_text_color(*ARES_TEXT)
        conclusion = (
            "Mision completada. Revisar hallazgos anteriores y adjuntar este reporte "
            "a Evidencias / caso de uso educativo."
            if status == "success"
            else "Mision finalizada con errores. Revisar el paso fallido y reintentar."
        )
        pdf.multi_cell(0, 6, _latin1(conclusion))
        pdf.ln(4)
        pdf.set_font("Courier", "I", 7)
        pdf.set_text_color(*ARES_RED_DARK)
        pdf.cell(0, 5, _latin1("Generado por ARES Mission Builder -- uso educativo"), align="C")

        pdf.output(str(path))
        return path

    except Exception:
        content = _minimal_pdf(title, (markdown_text or build_markdown(run))[:3500], run.get("status") or "unknown")
        path.write_bytes(content)
        return path


def _minimal_pdf(title: str, body: str, status: str = "unknown") -> bytes:
    """PDF 1.4 mínimo sin librerías externas, con acento rojo ARES."""
    def esc(s: str) -> str:
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    body_lines = [esc(l)[:100] for l in body.splitlines()[:75]]

    parts = [
        "BT", "/F1 14 Tf", "1 0 0 rg",  # rojo para el título
        f"50 780 Td", f"(ARES // {esc(title)}) Tj",
        "ET",
        "BT", "/F1 8 Tf", "0.75 0.75 0.75 rg",
        "50 762 Td", f"([{esc(status.upper())}]) Tj",
        "ET",
        "BT", "/F1 9 Tf", "0.9 0.9 0.9 rg", "14 TL",
        "50 745 Td",
    ]
    for i, line in enumerate(body_lines):
        if i == 0:
            parts.append(f"({line}) Tj")
        else:
            parts.append("T*")
            parts.append(f"({line}) Tj")
    parts.append("ET")
    stream = "\n".join(parts).encode("latin-1", errors="replace")

    objs: list[bytes] = []
    objs.append(b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
    objs.append(b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n")
    objs.append(
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
    )
    objs.append(
        f"4 0 obj<< /Length {len(stream)} >>stream\n".encode("ascii")
        + stream
        + b"\nendstream\nendobj\n"
    )
    objs.append(b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n")

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
        f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(out)


def generate_reports(run: dict[str, Any], mission: dict[str, Any] | None = None) -> dict[str, str]:
    md_path = write_markdown(run, mission)
    md_text = md_path.read_text(encoding="utf-8")
    pdf_path = write_pdf(run, md_text)
    return {
        "report_md_path": str(md_path),
        "report_pdf_path": str(pdf_path),
        "report_md": md_path.name,
        "report_pdf": pdf_path.name,
    }