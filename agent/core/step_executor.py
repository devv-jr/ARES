import json
import subprocess
import shlex
import sys
from pathlib import Path
from typing import Optional

from agent.core.prompt_engine import get_prompt
from agent.core import llm_client
from agent.core import docker_manager


def _find_target_ip(container_id: str) -> str:
    result = subprocess.run(
        ["docker", "inspect", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", container_id],
        capture_output=True, text=True, timeout=15,
    )
    ip = result.stdout.strip()
    return ip if ip else "127.0.0.1"


def _build_report(prompt: dict, context: dict, steps: list[dict], final_target_ip: Optional[str]) -> dict:
    """Compila un reporte estructurado con todos los resultados del pipeline."""
    step_results = []
    for i, s in enumerate(steps):
        step_results.append({
            "id": s["id"],
            "name": s["name"],
            "type": s["type"],
            "description": s.get("description", ""),
            "output": context.get(f"STEP_{i}_OUTPUT", ""),
        })

    analysis = ""
    for s in reversed(steps):
        if s["type"] == "llm_analyze":
            idx = steps.index(s)
            analysis = context.get(f"STEP_{idx}_OUTPUT", "")
            break

    return {
        "type": "pipeline:report",
        "title": prompt["title"],
        "subtitle": prompt.get("subtitle", ""),
        "targetIp": final_target_ip or "",
        "tools": prompt.get("tools", []),
        "stepResults": step_results,
        "analysis": analysis,
    }


def execute_pipeline(prompt_id: str, target_ip: Optional[str] = None):
    prompt = get_prompt(prompt_id)
    if not prompt:
        yield {"type": "pipeline:error", "error": f"Prompt '{prompt_id}' no encontrado."}
        return

    steps_meta = [{"id": s["id"], "name": s["name"], "description": s["description"]} for s in prompt["steps"]]
    yield {"type": "pipeline:start", "promptId": prompt_id, "title": prompt["title"], "steps": steps_meta}

    context = {}
    effective_target = target_ip

    if target_ip:
        context["TARGET_IP"] = target_ip

    for i, step in enumerate(prompt["steps"]):
        yield {"type": "step:start", "id": i, "name": step["name"], "description": step.get("description", "")}

        try:
            step_type = step["type"]
            config = step["config"]

            if step_type == "ping":
                host = context.get("TARGET_IP", "127.0.0.1")
                timeout = config.get("timeout", 10)
                yield {"type": "step:log", "id": i, "message": f"Verificando conectividad con {host}..."}

                ping_flag = "-n" if sys.platform == "win32" else "-c"
                timeout_flag = "-w" if sys.platform == "win32" else "-W"
                timeout_val = str(int(timeout * 1000)) if sys.platform == "win32" else str(timeout)
                cmd = ["ping", ping_flag, "1", timeout_flag, timeout_val, host]

                try:
                    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
                    if proc.returncode == 0:
                        yield {"type": "step:log", "id": i, "message": f"{host} está respondiendo."}
                        context[f"STEP_{i}_OUTPUT"] = f"Host {host} responde a ping."
                        yield {"type": "step:done", "id": i, "result": {"status": "alive", "host": host}}
                    else:
                        raise RuntimeError(f"No se recibió respuesta de {host}.")
                except subprocess.TimeoutExpired:
                    raise RuntimeError(f"Ping a {host} excedió el tiempo de espera.")

            elif step_type == "docker_deploy":
                scenario = config["scenario"]
                yield {"type": "step:log", "id": i, "message": f"Desplegando escenario: {scenario}..."}

                docker_path = docker_manager._scenario_path(scenario)
                result = docker_manager._run(["docker", "compose", "up", "-d"], docker_path)

                if result.returncode != 0:
                    raise RuntimeError(f"Error al desplegar Docker: {result.stderr.strip()[:500]}")

                container_id = docker_manager._primary_container_id(docker_path)
                if not container_id:
                    raise RuntimeError("No se pudo identificar el contenedor.")

                effective_target = _find_target_ip(container_id)

                context["CONTAINER_ID"] = container_id
                context["TARGET_IP"] = effective_target

                yield {"type": "step:log", "id": i, "message": f"Contenedor activo: {container_id[:12]} (IP: {effective_target})"}
                yield {"type": "step:log", "id": i, "message": "Entorno listo para operaciones."}
                yield {"type": "step:done", "id": i, "result": {"containerId": container_id, "ip": effective_target}}

            elif step_type == "command":
                cmd_template = config["command"]
                cmd = [part.format(TARGET_IP=context.get("TARGET_IP", "127.0.0.1"), **context) for part in cmd_template]
                timeout = config.get("timeout", 60)

                yield {"type": "step:log", "id": i, "message": f"Ejecutando: {' '.join(cmd)}"}

                proc = subprocess.run(
                    cmd, capture_output=True, text=True, timeout=timeout,
                )

                output = (proc.stdout or "") + (proc.stderr or "")
                output = output.strip()

                yield {"type": "step:log", "id": i, "message": output[:1000]}

                if proc.returncode != 0 and not output:
                    raise RuntimeError(f"Comando falló (código {proc.returncode})")

                context[f"STEP_{i}_OUTPUT"] = output
                yield {"type": "step:done", "id": i, "result": {"output": output[:500]}}

            elif step_type == "llm_analyze":
                prompt_template = config["prompt_template"]
                step_output = context.get(f"STEP_{i-1}_OUTPUT", "Sin datos del paso anterior.")

                llm_prompt = prompt_template.replace("{STEP_OUTPUT}", step_output)

                messages = [
                    {"role": "system", "content": "Eres ARES, un asistente de ciberseguridad. Responde de forma técnica y profesional."},
                    {"role": "user", "content": llm_prompt},
                ]

                yield {"type": "step:log", "id": i, "message": "ARES está analizando los resultados..."}

                full_response = []
                for chunk in llm_client.chat_stream(messages):
                    full_response.append(chunk)

                response_text = "".join(full_response)

                yield {"type": "step:log", "id": i, "message": response_text[:2000]}
                context[f"STEP_{i}_OUTPUT"] = response_text
                yield {"type": "step:done", "id": i, "result": {"summary": response_text[:300]}}

            elif step_type == "docker_destroy":
                scenario = config["scenario"]
                yield {"type": "step:log", "id": i, "message": f"Deteniendo escenario: {scenario}..."}

                docker_path = docker_manager._scenario_path(scenario)
                result = docker_manager._run(["docker", "compose", "down"], docker_path)

                if result.returncode != 0:
                    yield {"type": "step:log", "id": i, "message": f"Advertencia: {result.stderr.strip()[:300]}"}

                yield {"type": "step:log", "id": i, "message": "Entorno limpiado correctamente."}
                yield {"type": "step:done", "id": i, "result": {"status": "cleaned"}}

            else:
                raise RuntimeError(f"Tipo de paso desconocido: {step_type}")

        except subprocess.TimeoutExpired:
            yield {"type": "step:error", "id": i, "error": "El comando excedió el tiempo límite."}
            break
        except RuntimeError as e:
            yield {"type": "step:error", "id": i, "error": str(e)}
            break
        except Exception as e:
            yield {"type": "step:error", "id": i, "error": f"Error inesperado: {e}"}
            break

    yield _build_report(prompt, context, prompt["steps"], effective_target)
    yield {"type": "pipeline:done"}
