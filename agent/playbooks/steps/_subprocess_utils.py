"""
Utilidad compartida: corre un comando y va cediendo sus líneas de
stdout/stderr en tiempo real (para streaming a SSE).

Usamos `subprocess.Popen` dentro de un hilo (en vez de
`asyncio.create_subprocess_exec`) porque en Windows, cuando uvicorn corre
con `--reload` o `workers > 1`, usa `SelectorEventLoop` en lugar de
`ProactorEventLoop` (ver uvicorn/loops/asyncio.py). `SelectorEventLoop` en
Windows NO soporta subprocesos asyncio y lanza un `NotImplementedError`
sin mensaje. Con hilos evitamos esa limitación sin importar qué loop use
el servidor. Mismo patrón que ya usa `llm_analyze.py`.
"""
import asyncio
import subprocess
import threading
from typing import AsyncIterator


async def stream_subprocess(*cmd: str, timeout: int = 60) -> AsyncIterator[str]:
    loop = asyncio.get_running_loop()
    queue: "asyncio.Queue[tuple[str, object]]" = asyncio.Queue()

    def _worker() -> None:
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                errors="replace",
            )
        except OSError as exc:
            loop.call_soon_threadsafe(queue.put_nowait, ("spawn_error", exc))
            return

        try:
            assert proc.stdout is not None
            for raw_line in proc.stdout:
                loop.call_soon_threadsafe(queue.put_nowait, ("line", raw_line.rstrip()))
            returncode = proc.wait()
            loop.call_soon_threadsafe(queue.put_nowait, ("done", returncode))
        except Exception as exc:  # noqa: BLE001 - se reporta al consumidor
            proc.kill()
            proc.wait()
            loop.call_soon_threadsafe(queue.put_nowait, ("spawn_error", exc))

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()

    captured: list[str] = []
    returncode: int | None = None

    while True:
        try:
            kind, payload = await asyncio.wait_for(queue.get(), timeout=timeout)
        except asyncio.TimeoutError:
            raise RuntimeError(f"Comando '{' '.join(cmd)}' superó el timeout de {timeout}s")

        if kind == "line":
            line = str(payload)
            captured.append(line)
            yield line
        elif kind == "spawn_error":
            exc = payload
            raise RuntimeError(
                f"No se pudo ejecutar '{' '.join(cmd)}': {exc}"
            ) from exc
        elif kind == "done":
            returncode = int(payload)  # type: ignore[arg-type]
            break

    if returncode != 0:
        # Incluimos el output real (stderr/stdout mezclado) para que el error
        # llegue completo al frontend, no solo el código de salida.
        detail = " | ".join(captured[-5:]) if captured else "sin output"
        friendly = _friendly_docker_error(detail)
        if friendly:
            raise RuntimeError(friendly)
        raise RuntimeError(
            f"Comando '{' '.join(cmd)}' terminó con código {returncode}. Detalle: {detail}"
        )


def _friendly_docker_error(detail: str) -> str | None:
    """Traduce errores típicos de Docker Desktop (Windows) a mensajes accionables."""
    low = (detail or "").lower()
    docker_down = (
        "dockerdesktoplinuxengine" in low
        or "cannot connect to the docker daemon" in low
        or "error during connect" in low
        or "docker daemon is not running" in low
        or "is the docker daemon running" in low
        or (
            "pipe" in low
            and (
                "the system cannot find the file specified" in low
                or "el sistema no puede encontrar el archivo especificado" in low
            )
        )
    )
    if docker_down:
        return (
            "Docker Desktop no está en ejecución. "
            "Ábrelo desde el menú Inicio, espera a que diga 'Engine running' "
            "y vuelve a lanzar la misión. "
            "Las misiones con lab (Hardening Linux, OWASP, Port Sweep) requieren Docker."
        )
    if "permission denied" in low and "docker" in low:
        return (
            "Sin permiso para usar Docker. En Windows: asegúrate de que Docker Desktop "
            "esté iniciado y de que tu usuario pueda acceder al motor."
        )
    if "pull access denied" in low or ("not found" in low and "pull" in low):
        return (
            "No se pudo descargar la imagen Docker. Revisa tu conexión a internet "
            f"y que Docker Desktop esté en ejecución. Detalle: {detail}"
        )
    return None
