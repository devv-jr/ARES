from pathlib import Path
import json
import os

import httpx
from dotenv import load_dotenv
from agent.core.audit import audit

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

# --- NVIDIA NIM (opción principal) ---
DEFAULT_NIM_MODEL = "meta/llama-3.1-8b-instruct"
DEFAULT_NIM_TIMEOUT_SECONDS = 35.0
DEFAULT_NIM_MAX_TOKENS = 512

# --- OpenRouter (respaldo, desactivado por default) ---
DEFAULT_OPENROUTER_MODEL = "openrouter/auto"
DEFAULT_OPENROUTER_TIMEOUT_SECONDS = 35.0
DEFAULT_ALLOW_OPENROUTER_FALLBACK = False

# --- Ollama (respaldo, desactivado por default) ---
DEFAULT_HOST = "http://localhost:11434"
DEFAULT_MODEL = "qwen3.5:4b"
DEFAULT_TIMEOUT_SECONDS = 45.0
DEFAULT_CONNECT_TIMEOUT_SECONDS = 10.0
DEFAULT_KEEP_ALIVE = "10m"
DEFAULT_NUM_PREDICT = 192
DEFAULT_NUM_CTX = 2048
DEFAULT_ALLOW_OLLAMA_FALLBACK = False


def _strip_env(name: str, fallback: str = "") -> str:
    return os.environ.get(name, fallback).strip()


def _float_env(name: str, fallback: float) -> float:
    raw_value = os.environ.get(name, str(fallback))
    try:
        return float(raw_value)
    except ValueError:
        return fallback


def _int_env(name: str, fallback: int) -> int:
    raw_value = os.environ.get(name, str(fallback))
    try:
        return int(raw_value)
    except ValueError:
        return fallback


def _bool_env(name: str, fallback: bool) -> bool:
    return _strip_env(name, "true" if fallback else "false").lower() in {"1", "true", "yes", "on"}


def _get_config() -> dict:
    return {
        # NIM
        "nim_api_key": _strip_env("NIM_API_KEY") or _strip_env("NVIDIA_API_KEY"),
        "nim_model": _strip_env("NIM_MODEL", DEFAULT_NIM_MODEL),
        "nim_timeout_seconds": _float_env("NIM_TIMEOUT_SECONDS", DEFAULT_NIM_TIMEOUT_SECONDS),
        "nim_max_tokens": _int_env("NIM_MAX_TOKENS", DEFAULT_NIM_MAX_TOKENS),
        "nim_thinking_mode": _bool_env("NIM_THINKING_MODE", False),

        # OpenRouter
        "allow_openrouter_fallback": _bool_env(
            "ALLOW_OPENROUTER_FALLBACK", DEFAULT_ALLOW_OPENROUTER_FALLBACK
        ),
        "openrouter_api_key": _strip_env("OPENROUTER_API_KEY"),
        "openrouter_model": _strip_env("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL),
        "openrouter_timeout_seconds": _float_env(
            "OPENROUTER_TIMEOUT_SECONDS", DEFAULT_OPENROUTER_TIMEOUT_SECONDS
        ),

        # Ollama
        "allow_ollama_fallback": _bool_env("ALLOW_OLLAMA_FALLBACK", DEFAULT_ALLOW_OLLAMA_FALLBACK),
        "ollama_host": os.environ.get("OLLAMA_HOST", DEFAULT_HOST).rstrip("/"),
        "ollama_model": os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL),
        "ollama_keep_alive": os.environ.get("OLLAMA_KEEP_ALIVE", DEFAULT_KEEP_ALIVE),
        "ollama_timeout_seconds": _float_env("OLLAMA_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS),
        "ollama_connect_timeout_seconds": _float_env(
            "OLLAMA_CONNECT_TIMEOUT_SECONDS", DEFAULT_CONNECT_TIMEOUT_SECONDS
        ),
        "ollama_num_predict": _int_env("OLLAMA_NUM_PREDICT", DEFAULT_NUM_PREDICT),
        "ollama_num_ctx": _int_env("OLLAMA_NUM_CTX", DEFAULT_NUM_CTX),
    }


# ---------------------------------------------------------------------------
# NVIDIA NIM
# ---------------------------------------------------------------------------

def _chat_with_nim(messages: list[dict]) -> str:
    config = _get_config()
    api_key = config["nim_api_key"]
    if not api_key:
        raise ConnectionError("NVIDIA NIM no está configurado. Falta NIM_API_KEY o NVIDIA_API_KEY.")

    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    payload = {
        "model": config["nim_model"],
        "messages": messages,
        "max_tokens": config["nim_max_tokens"],
        "temperature": 0.4,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        timeout = httpx.Timeout(config["nim_timeout_seconds"], connect=10.0)
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise ConnectionError(
            f"NVIDIA NIM no respondió en {int(config['nim_timeout_seconds'])} segundos."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise ConnectionError("NVIDIA NIM alcanzó su límite de solicitudes (429).")
        if e.response.status_code == 401:
            raise ConnectionError("NVIDIA NIM rechazó la API key (401). Verifica NIM_API_KEY.")
        if e.response.status_code == 503:
            raise ConnectionError("NVIDIA NIM está sobrecargado (503). Intenta de nuevo.")
        raise ConnectionError(f"Error HTTP {e.response.status_code} de NVIDIA NIM.")
    except ValueError:
        raise ConnectionError("Respuesta inesperada de NVIDIA NIM. Revisa el formato de la API.")

    choices = data.get("choices", [])
    if not choices:
        raise ConnectionError("NVIDIA NIM respondió sin choices válidos.")

    text = choices[0].get("message", {}).get("content", "").strip()
    if not text:
        raise ConnectionError("NVIDIA NIM no devolvió texto utilizable.")

    return text


# ---------------------------------------------------------------------------
# OpenRouter (API compatible con OpenAI)
# ---------------------------------------------------------------------------

def _chat_with_openrouter(messages: list[dict]) -> str:
    config = _get_config()
    api_key = config["openrouter_api_key"]
    if not api_key:
        raise ConnectionError("OpenRouter no está configurado. Falta OPENROUTER_API_KEY.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": config["openrouter_model"],
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 512,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/devv-jr/ARES",
        "X-Title": "ARES",
    }

    timeout = httpx.Timeout(config["openrouter_timeout_seconds"], connect=10.0)

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise ConnectionError(
            f"OpenRouter no respondió en {int(config['openrouter_timeout_seconds'])} segundos."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise ConnectionError("OpenRouter alcanzó su límite de solicitudes (429).")
        if e.response.status_code == 401:
            raise ConnectionError("OpenRouter rechazó la API key (401). Verifica OPENROUTER_API_KEY.")
        if e.response.status_code == 503:
            raise ConnectionError("OpenRouter está sobrecargado (503). Intenta de nuevo.")
        raise ConnectionError(f"Error HTTP {e.response.status_code} de OpenRouter.")
    except ValueError:
        raise ConnectionError("Respuesta inesperada de OpenRouter. Revisa el formato de la API.")

    choices = data.get("choices", [])
    if not choices:
        raise ConnectionError("OpenRouter respondió sin choices válidos.")

    text = choices[0].get("message", {}).get("content", "").strip()
    if not text:
        raise ConnectionError("OpenRouter no devolvió texto utilizable.")

    return text


def _stream_with_openrouter(messages: list[dict]):
    config = _get_config()
    api_key = config["openrouter_api_key"]
    if not api_key:
        raise ConnectionError("OpenRouter no está configurado. Falta OPENROUTER_API_KEY.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": config["openrouter_model"],
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 512,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/devv-jr/ARES",
        "X-Title": "ARES",
    }

    try:
        timeout = httpx.Timeout(config["openrouter_timeout_seconds"], connect=10.0)
        with httpx.Client(timeout=timeout) as client:
            with client.stream("POST", url, json=payload, headers=headers) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[len("data: "):].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    choices = chunk.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
    except httpx.TimeoutException:
        raise ConnectionError(
            f"OpenRouter no respondió en {int(config['openrouter_timeout_seconds'])} segundos."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise ConnectionError("OpenRouter alcanzó su límite de solicitudes (429).")
        if e.response.status_code == 401:
            raise ConnectionError("OpenRouter rechazó la API key (401). Verifica OPENROUTER_API_KEY.")
        if e.response.status_code == 503:
            raise ConnectionError("OpenRouter está sobrecargado (503). Intenta de nuevo.")
        raise ConnectionError(f"Error HTTP {e.response.status_code} de OpenRouter.")
    except ConnectionError:
        raise
    except Exception as e:
        raise ConnectionError(f"Error inesperado leyendo el stream de OpenRouter: {e}")


# ---------------------------------------------------------------------------
# Ollama
# ---------------------------------------------------------------------------

def _chat_with_ollama(messages: list[dict]) -> str:
    config = _get_config()
    host = config["ollama_host"]
    model = config["ollama_model"]
    keep_alive = config["ollama_keep_alive"]
    timeout_seconds = config["ollama_timeout_seconds"]
    connect_timeout_seconds = config["ollama_connect_timeout_seconds"]
    num_predict = config["ollama_num_predict"]
    num_ctx = config["ollama_num_ctx"]

    url = f"{host}/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "keep_alive": keep_alive,
        "options": {
            "num_predict": num_predict,
            "num_ctx": num_ctx,
        },
    }

    try:
        timeout = httpx.Timeout(timeout_seconds, connect=connect_timeout_seconds)
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
    except httpx.ConnectError:
        raise ConnectionError(
            f"No pude conectar con Ollama en {host}. "
            "Verifica que el servicio esté corriendo (ollama serve)."
        )
    except httpx.TimeoutException:
        raise ConnectionError(
            f"El modelo no respondió en {int(timeout_seconds)} segundos. "
            "Puede que esté ocupado, descargándose o que el modelo sea demasiado pesado para este equipo."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise ConnectionError(
                f"El modelo '{model}' no existe en Ollama. "
                f"Ejecuta: ollama pull {model}"
            )
        raise ConnectionError(f"Error HTTP {e.response.status_code} de Ollama.")
    except (KeyError, ValueError):
        raise ConnectionError(
            "Respuesta inesperada de Ollama. Revisa que el modelo sea compatible."
        )


# ---------------------------------------------------------------------------
# Streaming: NIM, OpenRouter y Ollama soportan streaming real (chunk por
# chunk), ya que las tres APIs son compatibles con el formato de OpenAI.
# ---------------------------------------------------------------------------

def _stream_with_nim(messages: list[dict]):
    config = _get_config()
    api_key = config["nim_api_key"]
    if not api_key:
        raise ConnectionError("NVIDIA NIM no está configurado. Falta NIM_API_KEY o NVIDIA_API_KEY.")

    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    payload = {
        "model": config["nim_model"],
        "messages": messages,
        "max_tokens": config["nim_max_tokens"],
        "temperature": 0.4,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        timeout = httpx.Timeout(config["nim_timeout_seconds"], connect=10.0)
        with httpx.Client(timeout=timeout) as client:
            with client.stream("POST", url, json=payload, headers=headers) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[len("data: "):].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    choices = chunk.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
    except httpx.TimeoutException:
        raise ConnectionError(
            f"NVIDIA NIM no respondió en {int(config['nim_timeout_seconds'])} segundos."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise ConnectionError("NVIDIA NIM alcanzó su límite de solicitudes (429).")
        if e.response.status_code == 401:
            raise ConnectionError("NVIDIA NIM rechazó la API key (401). Verifica NIM_API_KEY.")
        if e.response.status_code == 503:
            raise ConnectionError("NVIDIA NIM está sobrecargado (503). Intenta de nuevo.")
        raise ConnectionError(f"Error HTTP {e.response.status_code} de NVIDIA NIM.")
    except ConnectionError:
        raise
    except Exception as e:
        raise ConnectionError(f"Error inesperado leyendo el stream de NVIDIA NIM: {e}")


def _stream_with_ollama(messages: list[dict]):
    config = _get_config()
    host = config["ollama_host"]
    model = config["ollama_model"]

    url = f"{host}/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "keep_alive": config["ollama_keep_alive"],
        "options": {
            "num_predict": config["ollama_num_predict"],
            "num_ctx": config["ollama_num_ctx"],
        },
    }

    try:
        timeout = httpx.Timeout(
            config["ollama_timeout_seconds"], connect=config["ollama_connect_timeout_seconds"]
        )
        with httpx.Client(timeout=timeout) as client:
            with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    content = chunk.get("message", {}).get("content")
                    if content:
                        yield content
                    if chunk.get("done"):
                        break
    except httpx.ConnectError:
        raise ConnectionError(
            f"No pude conectar con Ollama en {host}. "
            "Verifica que el servicio esté corriendo (ollama serve)."
        )
    except httpx.TimeoutException:
        raise ConnectionError(
            f"El modelo no respondió en {int(config['ollama_timeout_seconds'])} segundos."
        )
    except httpx.HTTPStatusError as e:
        raise ConnectionError(f"Error HTTP {e.response.status_code} de Ollama.")
    except ConnectionError:
        raise
    except Exception as e:
        raise ConnectionError(f"Error inesperado leyendo el stream de Ollama: {e}")


def chat_stream(messages: list[dict]):
    """Generador que entrega la respuesta en fragmentos conforme llegan.

    Sigue la misma cadena de prioridad que chat(): NIM -> OpenRouter (si está
    activado) -> Ollama (si está activado). Si un proveedor falla antes de
    entregar cualquier fragmento, se intenta el siguiente. Si falla a medio
    stream, lo ya entregado permanece (no se puede "deshacer" en el cliente).
    """
    config = _get_config()
    errors = []

    if config["nim_api_key"]:
        nim_attempts = 0
        while nim_attempts < 2:
            nim_attempts += 1
            try:
                delivered = False
                for piece in _stream_with_nim(messages):
                    delivered = True
                    yield piece
                if delivered:
                    audit.info("llm_provider", "llm", "Stream de NVIDIA NIM completado",
                               {"provider": "nim", "model": config["nim_model"]})
                    return
                errors.append("NIM: no entregó contenido.")
                continue
            except ConnectionError as exc:
                errors.append(f"NIM: {exc}")
                audit.warn("llm_fallback", "llm", f"NIM stream fall\u00f3: {exc}",
                           {"provider": "nim"})
                if nim_attempts >= 2:
                    break
    else:
        errors.append("NIM: no configurado (falta NIM_API_KEY).")

    if config["allow_openrouter_fallback"]:
        if config["openrouter_api_key"]:
            try:
                delivered = False
                for piece in _stream_with_openrouter(messages):
                    delivered = True
                    yield piece
                if delivered:
                    audit.info("llm_provider", "llm", "Stream de OpenRouter completado",
                               {"provider": "openrouter", "model": config["openrouter_model"]})
                    return
                errors.append("OpenRouter: no entregó contenido.")
            except ConnectionError as exc:
                errors.append(f"OpenRouter: {exc}")
                audit.warn("llm_fallback", "llm", f"OpenRouter stream fall\u00f3: {exc}",
                           {"provider": "openrouter"})
        else:
            errors.append("OpenRouter: fallback activado pero falta OPENROUTER_API_KEY.")

    if config["allow_ollama_fallback"]:
        try:
            delivered = False
            for piece in _stream_with_ollama(messages):
                delivered = True
                yield piece
            if delivered:
                audit.info("llm_provider", "llm", "Stream de Ollama completado",
                           {"provider": "ollama", "model": config["ollama_model"]})
                return
            errors.append("Ollama: no entregó contenido.")
        except ConnectionError as exc:
            errors.append(f"Ollama: {exc}")
            audit.warn("llm_fallback", "llm", f"Ollama stream fall\u00f3: {exc}",
                       {"provider": "ollama"})

    raise ConnectionError(
        "No fue posible obtener respuesta de ningún proveedor.\n" + "\n".join(errors)
    )


# ---------------------------------------------------------------------------
# Orquestación: NIM -> OpenRouter (opcional) -> Ollama (opcional)
# ---------------------------------------------------------------------------

def chat(messages: list[dict]) -> str:
    config = _get_config()
    errors = []

    # 1. NVIDIA NIM (opción principal)
    if config["nim_api_key"]:
        nim_attempts = 0
        while nim_attempts < 2:
            nim_attempts += 1
            try:
                result = _chat_with_nim(messages)
                audit.info("llm_provider", "llm", "Respuesta de NVIDIA NIM",
                           {"provider": "nim", "model": config["nim_model"]})
                return result
            except ConnectionError as exc:
                errors.append(f"NIM: {exc}")
                audit.warn("llm_fallback", "llm", f"NIM fall\u00f3, intentando respaldo: {exc}",
                           {"provider": "nim", "attempt": nim_attempts})
                if nim_attempts >= 2:
                    break
    else:
        errors.append("NIM: no configurado (falta NIM_API_KEY).")

    # 2. OpenRouter (respaldo, requiere activación explícita)
    if config["allow_openrouter_fallback"]:
        if config["openrouter_api_key"]:
            try:
                result = _chat_with_openrouter(messages)
                audit.info("llm_provider", "llm", "Respuesta de OpenRouter",
                           {"provider": "openrouter", "model": config["openrouter_model"]})
                return result
            except ConnectionError as exc:
                errors.append(f"OpenRouter: {exc}")
                audit.warn("llm_fallback", "llm", f"OpenRouter fall\u00f3: {exc}",
                           {"provider": "openrouter"})
        else:
            errors.append("OpenRouter: fallback activado pero falta OPENROUTER_API_KEY.")

    # 3. Ollama (respaldo, requiere activación explícita)
    if config["allow_ollama_fallback"]:
        try:
            result = _chat_with_ollama(messages)
            audit.info("llm_provider", "llm", "Respuesta de Ollama",
                       {"provider": "ollama", "model": config["ollama_model"]})
            return result
        except ConnectionError as exc:
            errors.append(f"Ollama: {exc}")
            audit.warn("llm_fallback", "llm", f"Ollama fall\u00f3: {exc}",
                       {"provider": "ollama"})

    raise ConnectionError(
        "No fue posible obtener respuesta de ningún proveedor.\n" + "\n".join(errors)
    )


def check_connection() -> bool:
    config = _get_config()

    if config["nim_api_key"]:
        return True

    if config["allow_openrouter_fallback"] and config["openrouter_api_key"]:
        return True

    if config["allow_ollama_fallback"]:
        host = config["ollama_host"]
        url = f"{host}/api/tags"
        try:
            with httpx.Client(timeout=5) as client:
                response = client.get(url)
                return response.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException):
            return False

    return False
