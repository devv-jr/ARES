# Muestra EDUCATIVA — NO es malware real.
# Contiene patrones típicos de scripts maliciosos para entrenamiento de análisis estático.
# ARES Mission Builder · Malware Investigation Lab

import base64
import os
import socket
import subprocess
import sys

# IOC-like strings (ficticios)
C2_HOST = "evil-lab.example.invalid"
C2_PORT = 4444
PERSIST_PATH = os.path.expanduser("~/.config/systemd/user/updater.service")

# Payload ofuscado (decodifica a texto benigno de demo)
_B64 = "cHJpbnQoIkFSRVMgZGVtbyAtIHNpbiBwYXlsb2FkIHJlYWwiKQ=="


def _decode_stage():
    return base64.b64decode(_B64).decode("utf-8", errors="ignore")


def collect_env():
    # Recolección de entorno (patrón de recon)
    return {
        "user": os.environ.get("USER") or os.environ.get("USERNAME"),
        "cwd": os.getcwd(),
        "platform": sys.platform,
    }


def fake_beacon():
    # NO se conecta de verdad en la demo de laboratorio ARES
    print(f"[demo] beacon simulado -> {C2_HOST}:{C2_PORT}")
    print(f"[demo] would open socket to {C2_HOST}")
    _ = socket
    return False


def fake_persist():
    print(f"[demo] persistencia simulada en {PERSIST_PATH}")
    return False


def run_hidden(cmd):
    # Patrón peligroso (documental): shell=True + input no validado
    print(f"[demo] subprocess pattern: {cmd}")
    _ = subprocess
    return None


if __name__ == "__main__":
    print("=== ARES Educational Sample ===")
    print(_decode_stage())
    print(collect_env())
    fake_beacon()
    fake_persist()
