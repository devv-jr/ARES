import os
import httpx

DEFAULT_HOST = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:7b-instruct"
TIMEOUT = 120


def _get_config():
    host = os.environ.get("OLLAMA_HOST", DEFAULT_HOST)
    model = os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)
    return host.rstrip("/"), model


def chat(messages: list[dict]) -> str:
    host, model = _get_config()
    url = f"{host}/api/chat"

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
    }

    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]
    except httpx.ConnectError:
        raise ConnectionError(
            f"No pude conectar con Ollama en {host}. "
            "Verifica que el servicio esté corriendo (ollama serve)."
        )
    except httpx.TimeoutException:
        raise ConnectionError(
            "El modelo no respondió en 120 segundos. "
            "Puede que el modelo esté ocupado o descargándose."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise ConnectionError(
                f"El modelo '{model}' no existe en Ollama. "
                "Ejecuta: ollama pull qwen2.5:7b-instruct"
            )
        raise ConnectionError(f"Error HTTP {e.response.status_code} de Ollama.")
    except (KeyError, ValueError):
        raise ConnectionError(
            "Respuesta inesperada de Ollama. Revisa que el modelo sea compatible."
        )


def check_connection() -> bool:
    host, _ = _get_config()
    url = f"{host}/api/tags"
    try:
        with httpx.Client(timeout=5) as client:
            resp = client.get(url)
            return resp.status_code == 200
    except (httpx.ConnectError, httpx.TimeoutException):
        return False
