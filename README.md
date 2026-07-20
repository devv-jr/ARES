<div align="center">

![](frontend/public/bg.png)

# ARES — Agente de IA para Ciberseguridad

**[ SISTEMA ACTIVO ] [ MODO AGENTE ] [ CIBERSEGURIDAD ]**

![Status](https://img.shields.io/badge/status-en%20desarrollo-brightgreen?style=flat-square&color=00ff41&labelColor=0d0d0d)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-blue?style=flat-square&color=00b4d8&labelColor=0d0d0d)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Python-orange?style=flat-square&color=ff6b35&labelColor=0d0d0d)
![AI](https://img.shields.io/badge/AI-agentic-purple?style=flat-square&color=9d4edd&labelColor=0d0d0d)
![License](https://img.shields.io/badge/license-MIT-red?style=flat-square&color=e63946&labelColor=0d0d0d)

*Asistente inteligente de ciberseguridad — Feria de Ciencias IEU 2026*

</div>

---

```
> Inicializando ARES...
> Cargando módulos de seguridad... [OK]
> Conectando con servicios de IA... [OK]
> Agente listo para operar.
```

---

## `~/` ¿Qué es ARES?

**ARES** es una solución de inteligencia artificial agéntica enfocada en ciberseguridad, diseñada para actuar como asistente técnico accesible desde una página web.

El sistema analiza solicitudes del usuario, proporciona explicaciones técnicas, orienta procesos de aprendizaje y ofrece recomendaciones especializadas en seguridad informática, todo a través de una interfaz conversacional impulsada por agentes de IA.

> *"Porque el conocimiento en ciberseguridad no debería estar detrás de una pared de requisitos técnicos."*

---

## `~/features` Capacidades del Agente

```mermaid
flowchart LR
    ARES["ARES"]

    ARES --> M1["🛡️ Asistencia técnica"]
    M1 --> M1D["Soporte en temas de<br/>ciberseguridad en tiempo real"]

    ARES --> M2["📚 Aprendizaje guiado"]
    M2 --> M2D["Rutas de conocimiento<br/>adaptadas al nivel del usuario"]

    ARES --> M3["🔍 Análisis de info"]
    M3 --> M3D["Procesamiento y evaluación<br/>de datos e inputs del usuario"]

    ARES --> M4["💬 Consultas especializadas"]
    M4 --> M4D["Respuestas especializadas<br/>con contexto de seguridad"]

    ARES --> M5["⚡ Recomendaciones"]
    M5 --> M5D["Sugerencias y mejores<br/>prácticas personalizadas"]
```

---

## `~/stack` Arquitectura del Sistema

```mermaid
flowchart TD
    U["👤 USUARIO"]

    subgraph L1["🌐 CAPA DE PRESENTACIÓN<br/>React + Next.js · PWA (Web App)"]
        direction LR
        Chat["Chat UI"]
        Dash["Dashboard"]
    end

    subgraph L2["🤖 CAPA DEL AGENTE (Python)"]
        direction LR
        Orq["Orquestador<br/>de Agente"] --> Proc["Procesador<br/>de Tareas"] --> Gest["Gesture Engine<br/>(respuestas)"]
    end

    subgraph L3["🧠 SERVICIOS DE INTELIGENCIA"]
        direction LR
        LLM["LLM Provider"]
        Emb["Embeddings"]
        Tools["Tools"]
    end

    U --> L1
    L1 -->|API calls| L2
    L2 --> L3
```

### Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Web App | React, Next.js |
| Agente / Backend | Python |
| IA | LLM vía API (agéntico) |
| Comunicación | REST / WebSocket |

---

## `~/install` Instalación

### Requisitos previos

```bash
node >= 18.0.0
python >= 3.11
```

### Clonar el repositorio

```bash
git clone https://github.com/devv-jr/ARES.git
cd ARES
```

### Preparar el entorno
```bash
python -m venv venv
source venv/bin/activate      # Linux/macOS
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

### Web App (Next.js)

```bash
cd frontend
pnpm i
pnpm dev
```

### Backend para levantar al agente (Python)

```bash
cd backend

uvicorn app.main:app --reload
```

### Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus API keys y configuración
```

---

## `~/env` Variables de Entorno

```env
# Servicios de IA
# NIM (principal — se usa si tiene key, sin flag adicional)
NIM_API_KEY=nvapi-xxxxxxxxxxxxxxxx
NIM_MODEL=deepseek-ai/deepseek-v4-flash
NIM_TIMEOUT_SECONDS=35
NIM_MAX_TOKENS=512

# OpenRouter (respaldo, desactivado por default)
ALLOW_OPENROUTER_FALLBACK=false
OPENROUTER_API_KEY=tu_key_aqui
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_TIMEOUT_SECONDS=35

# Ollama (respaldo, desactivado por default)
ALLOW_OLLAMA_FALLBACK=false

# ARES — Motor del Agente
ARES_MAX_CONTEXT_CHARS=2000
ARES_MAX_HISTORY_TURNS=3
ARES_RPM_LIMIT=35
```

---

## `~/structure` Estructura del Proyecto

```mermaid
flowchart LR
    ROOT["ARES/"]

    ROOT --> FE["🌐 frontend/<br/>Web App React + Next.js (PWA)"]
    FE --> FESRC["src/"]
    FESRC --> FEPAGES["pages/<br/>Vistas principales"]
    FESRC --> FECOMP["components/<br/>Componentes reutilizables"]
    FESRC --> FEHOOKS["hooks/<br/>Custom hooks"]
    FESRC --> FESERV["services/<br/>Llamadas al agente"]
    FE --> FEPUB["public/<br/>Assets estáticos + manifest.json"]

    ROOT --> BE["💻 backend/<br/>API REST y conexión entre el modelo de IA y el Frontend"]
    BE --> BEAPP["app/"]
    BEAPP --> BEROUTES["routes/<br/>Endpoints y rutas de la API (Controladores)"]
    BEAPP --> BESERV["services/<br/>Lógica de negocio y servicios externos (BD, APIs)"]
    BEAPP --> BEMAIN["main.py<br/>Archivo principal de arranque de la aplicación (FastAPI/Flask)"]

    ROOT --> AG["🤖 agent/<br/>Módulo del Agente de IA y Configuración del LLM"]
    AG --> AGCORE["core/<br/>Lógica central del agente, toma de decisiones y memoria"]
    AG --> AGTOOLS["tools/<br/>Herramientas y funciones que el agente puede ejecutar"]
    AG --> AGKNOW["knowledge/<br/>Base de conocimiento local (Vectores, RAG, documentos)"]
    AG --> AGPROMPTS["prompts/<br/>Plantillas de instrucciones y system prompts del sistema"]

    ROOT --> DOCS["📄 docs/<br/>Documentación técnica"]
    ROOT --> RM["README.md<br/>Documento principal del proyecto ARES"]
```

---

## `~/team` Equipo

> Proyecto desarrollado para la **Feria de Ciencias — IEU Universidad, Puebla 2026**

| Integrante | Rol |                                                            
|-|-----------|-----|
| **Bruno** | Tech Lead · Full Stack Developer · Arquitectura e Integración |
| **Yered** | Frontend Developer · UI/UX Lead · Experiencia de usuario |
| **Jairo** | Backend Developer Junior · Python · Lógica del agente |
| **Axel** | Security Research · Documentación · Investigación en ciberseguridad |

---

## `~/license` Licencia

```
MIT License — 2026
ARES Project Team · IEU Universidad · Puebla, México
```

---

<div align="center">

```
[ ARES — AGENTE INTELIGENTE PARA CIBERSEGURIDAD ]
[ SISTEMA DESARROLLADO CON FINES EDUCATIVOS ]
[ IEU UNIVERSIDAD · PUEBLA · 2026 ]
```

</div>