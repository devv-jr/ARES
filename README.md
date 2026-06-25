```
 ▄▄▄       ▓█████▄  ▄▄▄      
▒████▄     ▒██▀ ██▌▒████▄    
▒██  ▀█▄   ░██   █▌▒██  ▀█▄  
░██▄▄▄▄██  ░▓█▄   ▌░██▄▄▄▄██ 
 ▓█   ▓██▒ ░▒████▓  ▓█   ▓██▒
 ▒▒   ▓▒█░  ▒▒▓  ▒  ▒▒   ▓▒█░
  ▒   ▒▒ ░  ░ ▒  ▒   ▒   ▒▒ ░
  ░   ▒     ░ ░  ░   ░   ▒   
      ░  ░    ░          ░  ░ 
           ░                  
```

<div align="center">

# ADA — Agente de Defensa Autónomo

**[ SISTEMA ACTIVO ] [ MODO AGENTE ] [ CIBERSEGURIDAD ]**

![Status](https://img.shields.io/badge/status-en%20desarrollo-brightgreen?style=flat-square&color=00ff41&labelColor=0d0d0d)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue?style=flat-square&color=00b4d8&labelColor=0d0d0d)
![Stack](https://img.shields.io/badge/stack-React%20Native%20%2B%20Python-orange?style=flat-square&color=ff6b35&labelColor=0d0d0d)
![AI](https://img.shields.io/badge/AI-agentic-purple?style=flat-square&color=9d4edd&labelColor=0d0d0d)
![License](https://img.shields.io/badge/license-MIT-red?style=flat-square&color=e63946&labelColor=0d0d0d)

*Asistente inteligente de ciberseguridad — Feria de Ciencias IEU 2026*

</div>

---

```
> Inicializando ADA...
> Cargando módulos de seguridad... [OK]
> Conectando con servicios de IA... [OK]
> Agente listo para operar.
```

---

## `~/` ¿Qué es ADA?

**ADA** (Agente de Defensa Autónomo) es una solución de inteligencia artificial agéntica enfocada en ciberseguridad, diseñada para actuar como asistente técnico accesible desde dispositivos móviles.

El sistema analiza solicitudes del usuario, proporciona explicaciones técnicas, orienta procesos de aprendizaje y ofrece recomendaciones especializadas en seguridad informática, todo a través de una interfaz conversacional impulsada por agentes de IA.

> *"Porque el conocimiento en ciberseguridad no debería estar detrás de una pared de requisitos técnicos."*

---

## `~/features` Capacidades del Agente

```
┌─────────────────────────────────────────────────────────┐
│  MÓDULOS ACTIVOS                                        │
├──────────────────────────┬──────────────────────────────┤
│  🛡️  Asistencia técnica  │  Soporte en temas de         │
│                          │  ciberseguridad en tiempo    │
│                          │  real                        │
├──────────────────────────┼──────────────────────────────┤
│  📚  Aprendizaje guiado  │  Rutas de conocimiento       │
│                          │  adaptadas al nivel del      │
│                          │  usuario                     │
├──────────────────────────┼──────────────────────────────┤
│  🔍  Análisis de info    │  Procesamiento y evaluación  │
│                          │  de datos e inputs del       │
│                          │  usuario                     │
├──────────────────────────┼──────────────────────────────┤
│  💬  Consultas           │  Respuestas especializadas   │
│      especializadas      │  con contexto de seguridad   │
├──────────────────────────┼──────────────────────────────┤
│  ⚡  Recomendaciones     │  Sugerencias y mejores       │
│                          │  prácticas personalizadas    │
└──────────────────────────┴──────────────────────────────┘
```

---

## `~/stack` Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│              📱  CAPA DE PRESENTACIÓN                        │
│                                                              │
│         React Native + Expo (iOS / Android)                  │
│         ┌─────────────┐  ┌──────────────┐                   │
│         │  Chat UI    │  │  Dashboard   │                   │
│         └─────────────┘  └──────────────┘                   │
└──────────────────────────────┬───────────────────────────────┘
                               │  API calls
                               ▼
┌──────────────────────────────────────────────────────────────┐
│              🤖  CAPA DEL AGENTE (Python)                    │
│                                                              │
│   ┌──────────────┐   ┌─────────────┐   ┌────────────────┐  │
│   │  Orquestador │──▶│  Procesador │──▶│ Gesture Engine │  │
│   │  de Agente   │   │  de Tareas  │   │  (respuestas)  │  │
│   └──────────────┘   └─────────────┘   └────────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│              🧠  SERVICIOS DE INTELIGENCIA                   │
│                                                              │
│          LLM Provider  ·  Embeddings  ·  Tools               │
└──────────────────────────────────────────────────────────────┘
```

### Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Mobile App | React Native, Expo |
| Agente / Backend | Python |
| IA | LLM vía API (agéntico) |
| Comunicación | REST / WebSocket |

---

## `~/install` Instalación

### Requisitos previos

```bash
node >= 18.0.0
python >= 3.11
expo-cli instalado globalmente
```

### Clonar el repositorio

```bash
git clone https://github.com/tu-org/ADA.git
cd ADA
```

### App móvil (React Native + Expo)

```bash
cd mobile
npm install
npx expo start
```

### Backend del agente (Python)

```bash
cd agent
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
# .venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

### Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus API keys y configuración
```

### Levantar el agente

```bash
python main.py
```

---

## `~/env` Variables de Entorno

```env
# Servicios de IA
AI_API_KEY=your_api_key_here
AI_MODEL=claude-sonnet-4-6        # o el modelo de tu elección

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=false

# Mobile (expo)
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## `~/structure` Estructura del Proyecto

```
ADA/
├── 📱 mobile/                  # App React Native + Expo
│   ├── app/                    # Rutas (Expo Router)
│   ├── components/             # Componentes reutilizables
│   ├── hooks/                  # Custom hooks
│   └── services/               # Llamadas al agente
│
├── 🤖 agent/                   # Backend Python
│   ├── core/                   # Lógica del agente
│   ├── tools/                  # Herramientas del agente
│   ├── api/                    # Endpoints REST
│   └── main.py                 # Entry point
│
├── 📄 docs/                    # Documentación técnica
└── README.md
```

---

## `~/team` Equipo

> Proyecto desarrollado para la **Feria de Ciencias — IEU Universidad, Puebla 2026**

| Rol | Responsable |
|-----|------------|
| Desarrollo móvil | — |
| Backend / Agente IA | — |
| Diseño UX/UI | — |

---

## `~/license` Licencia

```
MIT License — 2026
ADA Project Team · IEU Universidad · Puebla, México
```

---

<div align="center">

```
[ ADA — AGENTE DE DEFENSA AUTÓNOMO ]
[ SISTEMA DESARROLLADO CON FINES EDUCATIVOS ]
[ IEU UNIVERSIDAD · PUEBLA · 2026 ]
```

</div>
