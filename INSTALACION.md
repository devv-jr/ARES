```
 ▄▄▄       ██▀███  ▓█████   ██████ 
▒████▄    ▓██ ▒ ██▒▓█   ▀ ▒██    ▒ 
▒██  ▀█▄  ▓██ ░▄█ ▒▒███   ░ ▓██▄   
░██▄▄▄▄██ ▒██▀▀█▄  ▒▓█  ▄   ▒   ██▒
 ▓█   ▓██▒░██▓ ▒██▒░▒████▒▒██████▒▒
 ▒▒   ▓▒█░░ ▒▓ ░▒▓░░░ ▒░ ░▒ ▒▓▒ ▒ ░
  ▒   ▒▒ ░  ░▒ ░ ▒░ ░ ░  ░░ ░▒  ░ ░
  ░   ▒     ░░   ░    ░   ░  ░  ░  
      ░  ░   ░        ░  ░      ░  
```

<div align="center">

# 🛡️ ARES — Guía de Instalación

**[ SISTEMA ACTIVO ] [ MODO AGENTE ] [ CIBERSEGURIDAD ]**

![Status](https://img.shields.io/badge/status-en%20desarrollo-brightgreen?style=flat-square&color=00ff41&labelColor=0d0d0d)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-blue?style=flat-square&color=00b4d8&labelColor=0d0d0d)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Python-orange?style=flat-square&color=ff6b35&labelColor=0d0d0d)
![AI](https://img.shields.io/badge/AI-agentic-purple?style=flat-square&color=9d4edd&labelColor=0d0d0d)
![License](https://img.shields.io/badge/license-MIT-red?style=flat-square&color=e63946&labelColor=0d0d0d)

*Repositorio: [github.com/devv-jr/ARES](https://github.com/devv-jr/ARES)*

</div>

---

```
> Inicializando guía de instalación...
> Verificando requisitos del sistema... [OK]
> Preparando entorno de despliegue... [OK]
> Listo para desplegar ARES.
```

---

## `~/` Tabla de contenido

- [Requisitos previos](#requisitos-previos)
- [1. Clonar el repositorio](#1-clonar-el-repositorio)
- [2. Backend del agente (Python)](#2-backend-del-agente-python)
- [3. Variables de entorno](#3-variables-de-entorno)
- [4. Frontend (React + Next.js)](#4-frontend-react--nextjs)
- [Arquitectura resultante](#arquitectura-resultante)
- [Verificación rápida](#verificación-rápida)
- [Solución de problemas](#solución-de-problemas)

---

## `~/requisitos` Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| 🟢 Node.js | `>= 18.0.0` | `node -v` |
| 🐍 Python | `>= 3.11` | `python --version` |
| 📦 pnpm | última | `pnpm -v` |
| 🔧 Git | cualquiera | `git --version` |
| 🐳 Docker *(opcional, labs)* | última | `docker --version` |

```
node >= 18.0.0
python >= 3.11
```

> 💡 Si no tienes `pnpm`, instálalo con: `npm install -g pnpm`

---

## `~/paso-1` 1. Clonar el repositorio

```bash
git clone https://github.com/devv-jr/ARES.git
cd ARES
```

![Clonando el repositorio ARES](assets/install_01_clone.gif)

Estructura que deberías ver tras clonar:

```
ARES/
├── 🌐 frontend/          # Web App React + Next.js (PWA)
├── 💻 backend/           # API REST (FastAPI)
├── 🤖 agent/             # Módulo del agente de IA + LLM

├── 📄 docs/              # Documentación técnica
├── .env.example
├── requirements.txt
└── README.md
```

---

## `~/paso-2` 2. Backend del agente (Python)

El agente vive en `agent/` y expone la lógica de IA (cliente LLM, RAG, orquestador).

```bash
cd agent
python -m venv venv
source venv/bin/activate      # Linux/macOS
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

![Instalando dependencias del backend](assets/install_02_backend.gif)

Una vez instaladas las dependencias, levanta el agente:

```bash
uvicorn app.main:app --reload
```

![Agente ARES iniciando](assets/install_04_run_agent.gif)

El backend quedará escuchando en `http://localhost:8000` por defecto.

---

## `~/paso-3` 3. Variables de entorno

Copia el archivo de ejemplo y complétalo con tus propias claves:

```bash
cp .env.example .env
```

![Configurando variables de entorno](assets/install_03_env.gif)

Variables clave a revisar:

```env
# NIM (Servicio de LLMs de NVIDIA NIM)
NIM_API_KEY=nvapi-xxxxxxxxxxxxx              # Aqui colocas la API KEY que obtienes de https://build.nvidia.com/settings/api-keys
NIM_MODEL=meta/llama-3.1-8b-instruct
NIM_TIMEOUT_SECONDS=35
NIM_MAX_TOKENS=512

# OpenRouter (respaldo, desactivado por default)
ALLOW_OPENROUTER_FALLBACK=false
OPENROUTER_API_KEY=tu_key_aqui               # Aqui colocas la API KEY que obtienes de https://openrouter.ai/workspaces/default/keys
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_TIMEOUT_SECONDS=35

# Ollama (respaldo, desactivado por default)
ALLOW_OLLAMA_FALLBACK=false

# ARES — Motor del Agente
ARES_MAX_CONTEXT_CHARS=2000
ARES_MAX_HISTORY_TURNS=3
ARES_RPM_LIMIT=35
```

> ⚠️⚠️ **Nunca subas tu `.env` a GitHub.** Ya está incluido en `.gitignore`. ⚠️⚠️

---

## `~/paso-4` 4. Frontend (React + Next.js)

```bash
cd frontend
pnpm install
pnpm dev
```

![Levantando el frontend](assets/install_05_frontend.gif)

La aplicación quedará disponible en `http://localhost:3000`.

---

## `~/arquitectura` Arquitectura resultante

Tras completar los pasos, tendrás los servicios corriendo en conjunto:

![Arquitectura del sistema ARES](assets/architecture.png)

Resumen del flujo de instalación:

![Flujo de instalación](assets/install_flow.png)

| Servicio | Puerto | Comando |
|---|---|---|---|
| Backend / Agente | `8000` | `uvicorn main:app --reload` |
| Frontend (Next.js) | `3000` | `pnpm dev` |

---

## `~/verificar` Verificación rápida

```
┌─────────────────────────────────────────────┐
│  CHECKLIST DE INSTALACIÓN                    │
├───────────────────────────────┬─────────────┤
│  Backend responde en :8000     │   [ ]       │
│  Frontend carga en :3000       │   [ ]       │
│  .env configurado              │   [ ]       │
│  Chat responde a un mensaje    │   [ ]       │
└───────────────────────────────┴─────────────┘
```

Prueba rápida del backend:

```bash
curl http://localhost:8000/health
```

---

## `~/troubleshooting` Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `ModuleNotFoundError` en `agent/` | Entorno virtual no activado | `source venv/bin/activate` antes de correr `uvicorn main:app --reload` |
| El agente no responde | Falta `AI_API_KEY` en `.env` | Completa la clave del proveedor primario (NVIDIA NIM) |
| Error de CORS en el frontend | `EXPO_PUBLIC_API_URL` / URL de backend mal configurada | Revisa que apunte a `http://localhost:8000` |
| `pnpm: command not found` | pnpm no instalado globalmente | `npm install -g pnpm` |

---

<div align="center">

```
[ ARES — AGENTE INTELIGENTE PARA CIBERSEGURIDAD ]
[ INSTALACIÓN COMPLETADA CON ÉXITO ]
[ IEU UNIVERSIDAD · PUEBLA · 2026 ]
```

**Hecho con 🛡️ por el equipo ARES — Feria de Ciencias IEU 2026**

</div>
