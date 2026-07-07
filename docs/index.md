
```ascii
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

# 🛡️ ARES — Documentación Oficial

## *Agente de IA para Ciberseguridad*

<br>

![Feria de Ciencias](https://img.shields.io/badge/FERIA%20DE%20CIENCIAS-IEU%202026-ff6b35?style=for-the-badge&labelColor=0d0d0d)
![Universidad](https://img.shields.io/badge/IEU-UNIVERSIDAD%20PUEBLA-00b4d8?style=for-the-badge&labelColor=0d0d0d)
![Equipo](https://img.shields.io/badge/EQUIPO-4%20MIEMBROS-9d4edd?style=for-the-badge&labelColor=0d0d0d)

<br>

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   "Porque el conocimiento en ciberseguridad no debería        ║
║    estar detrás de una pared de requisitos técnicos."         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

</div>

---

## 📋 Índice de Documentos

| # | Documento | Descripción |
|---|-----------|-------------|
| 1 | [`team.md`](./team.md) | Perfiles del equipo ARES |
| 2 | [`speech-bruno.md`](./speech-bruno.md) | Guion de presentación — Bruno (Tech Lead) |
| 3 | [`speech-yered.md`](./speech-yered.md) | Guion de presentación — Yered (Frontend/UI) |
| 4 | [`speech-jairo.md`](./speech-jairo.md) | Guion de presentación — Jairo (Backend/Python) |
| 5 | [`speech-axel.md`](./speech-axel.md) | Guion de presentación — Axel (Security Research) |
| 6 | [`fair-presentation.md`](./fair-presentation.md) | Presentación general para la feria de ciencias |

---

## 🎯 Sobre ARES

**ARES** es un **sistema de inteligencia artificial agéntica** enfocado en ciberseguridad, diseñado para democratizar el acceso al conocimiento técnico en seguridad informática.

```
┌─────────────────────────────────────────────────────────────┐
│                     ¿QUÉ HACE ARES?                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   🛡️  Asiste en temas de ciberseguridad en tiempo real      │
│   📚  Guía el aprendizaje adaptativo en seguridad           │
│   🔍  Analiza y evalúa información del usuario              │
│   💬  Responde consultas especializadas contextualizadas    │
│   ⚡  Recomienda mejores prácticas personalizadas           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modos de Operación

| Modo | Función |
|------|---------|
| 🎓 **Learning** | Modo tutor — explica conceptos desde lo básico hasta lo avanzado |
| 🔴 **Red Team** | Pentesting ético — metodologías PTES/OWASP con advertencias legales |
| 🔵 **Blue Team** | Defensa y respuesta a incidentes — hardening, monitoreo, contención |
| 💻 **Developer** | DevSecOps — codificación segura, SAST/DAST, seguridad en contenedores |

---

## 🏛️ Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
│                  ┌──────────────────┐                        │
│                  │  Navegador Web   │                        │
│                  │  / App Móvil    │                        │
│                  └────────┬─────────┘                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              🌐  FRONTEND (Next.js + React)                  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│   │  Dashboard   │  │  Chat Stream │  │  4 Modos UI     │  │
│   │  Animado     │  │  (SSE)       │  │  Selector       │  │
│   └──────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │  API REST / SSE
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              💻  BACKEND (FastAPI - Python)                   │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│   │  Endpoints   │  │  Service     │  │  CORS / Rutas   │  │
│   │  REST/SSE    │  │  Bridge      │  │                 │  │
│   └──────────────┘  └──────┬───────┘  └─────────────────┘  │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              🤖  AGENTE (Core - Python)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │Pipeline  │  │Memoria   │  │Rate      │  │Guardrails   │ │
│  │10 pasos  │  │Sesiones  │  │Limiter   │  │Seguridad    │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └─────────────┘ │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           MOTOR DE CONOCIMIENTO (RAG)                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Documentos  │  │ Retriever   │  │ Prompts por  │  │  │
│  │  │ Técnicos    │  │ (keyword TF)│  │ Modo         │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│              🧠  PROVEEDORES DE IA (Failover)                │
│                                                              │
│   🥇 NVIDIA NIM (primario)                                   │
│   🥈 OpenRouter (fallback)                                   │
│   🥉 Ollama Local (fallback final)                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
ARES/
│
├── 🌐 frontend/              # Web App React + Next.js (PWA)
│   ├── src/app/
│   │   ├── page.jsx          # Dashboard completo + Chat UI
│   │   ├── layout.jsx        # Layout con tema oscuro
│   │   └── globals.css       # Estilos y animaciones
│   └── public/               # Assets y manifest.json
│
├── 💻 backend/               # API REST FastAPI
│   ├── app/
│   │   ├── main.py           # Servidor + 6 endpoints
│   │   ├── models/chat.py    # Modelos Pydantic
│   │   └── services/         # Bridge al agente
│   └── requirements.txt
│
├── 🤖 agent/                 # Núcleo del Agente de IA
│   ├── core/
│   │   ├── agent.py          # Orquestador (Pipeline 10 pasos)
│   │   ├── llm_client.py     # Cliente LLM con failover triple
│   │   ├── memory.py         # Memoria de conversación
│   │   └── rate_limiter.py   # Control de tasa (35 RPM)
│   ├── prompts/              # System prompts por modo
│   ├── knowledge/            # Base de conocimiento (RAG)
│   └── tools/                # Sistema extensible de herramientas
│
├── 📄 docs/                  # Documentación (este directorio)
│   ├── index.md              # Inicio
│   ├── team.md               # Perfiles del equipo
│   ├── speech-bruno.md       # Guion - Bruno
│   ├── speech-yered.md       # Guion - Yered
│   ├── speech-jairo.md       # Guion - Jairo
│   ├── speech-axel.md        # Guion - Axel
│   └── fair-presentation.md  # Presentación general
│
└── README.md                 # Documento principal del proyecto
```

---

## 🛠️ Stack Tecnológico

<div align="center">

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| 🌐 **Frontend** | Next.js 16 + React 19 + Tailwind CSS v4 | Interfaz de usuario PWA |
| 💻 **Backend** | FastAPI (Python) | API REST y SSE streaming |
| 🤖 **Agente** | Python + Arquitectura agéntica | Pipeline de razonamiento IA |
| 🧠 **LLM** | NVIDIA NIM → OpenRouter → Ollama | Inferencia del modelo de lenguaje |
| 📚 **RAG** | Keyword TF Matching | Recuperación de conocimiento |
| 🔒 **Guardrails** | Detección de patrones (XSS, SQLi, credenciales) | Seguridad del sistema |

</div>

---

## 👥 El Equipo

| Avatar | Integrante | Rol | Especialidad |
|--------|-----------|-----|-------------|
| 🦏 | **Bruno** | Tech Lead · Full Stack | Arquitectura, Integración, Liderazgo técnico |
| 🎨 | **Yered** | Frontend Developer · UI/UX | Experiencia de usuario, Animaciones, Diseño |
| 🐍 | **Jairo** | Backend Developer · Python | Lógica del agente, APIs, Pipeline de IA |
| 📚 | **Axel** | Security Research · Documentación | Investigación, Base de conocimiento, RAG |

> Conoce más sobre el equipo en [`team.md`](./team.md)

---

## 📜 Licencia

```
MIT License — 2026
ARES Project Team · IEU Universidad · Puebla, México
```

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏆  FERIA DE CIENCIAS IEU 2026  🏆                          ║
║   "Innovación en Ciberseguridad con Inteligencia Artificial"   ║
║                                                               ║
║   IEU Universidad · Puebla, México · Julio 2026               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**[<< Volver al README principal](../README.md)**

</div>
