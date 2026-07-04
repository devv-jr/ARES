
```ascii
███████╗███████╗██████╗ ██╗ █████╗
██╔════╝██╔════╝██╔══██╗██║██╔══██╗
█████╗  █████╗  ██████╔╝██║███████║
██╔══╝  ██╔══╝  ██╔══██╗██║██╔══██║
██║     ███████╗██║  ██║██║██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝

██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗ ██████╗
██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝██╔═══██╗
██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║   ██║   ██║
██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║   ██║   ██║
██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║   ╚██████╔╝
╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝
```

<div align="center">

# 🏆 FERIA DE CIENCIAS IEU 2026

## *Presentación General del Proyecto ARES*

<br>

![Banner](https://img.shields.io/badge/IEU%20UNIVERSIDAD-FERIA%20DE%20CIENCIAS%202026-ff6b35?style=for-the-badge&labelColor=0d0d0d)
![Date](https://img.shields.io/badge/FECHA-JULIO%202026-00b4d8?style=for-the-badge&labelColor=0d0d0d)
![Location](https://img.shields.io/badge/UBICACIÓN-PUEBLA%2C%20MÉX-00ff41?style=for-the-badge&labelColor=0d0d0d)

<br>

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ARES: Agente de IA para Ciberseguridad                      ║
║   —————————————————————————————————————                       ║
║                                                               ║
║   "Democratizando el conocimiento en seguridad                ║
║    informática a través de inteligencia artificial            ║
║    agéntica."                                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

</div>

---

## 📋 Ficha del Proyecto

| Campo | Información |
|-------|-------------|
| **Nombre del proyecto** | ARES — Agente de IA para Ciberseguridad |
| **Categoría** | Tecnología / Inteligencia Artificial / Ciberseguridad |
| **Institución** | IEU Universidad, Puebla |
| **Evento** | Feria de Ciencias 2026 |
| **Equipo** | Bruno, Yered, Jairo, Axel |
| **Tecnologías** | Next.js, React, Python, FastAPI, NVIDIA NIM, Gemini |
| **Licencia** | MIT Open Source |

---

## 🎯 Resumen Ejecutivo

```
┌─────────────────────────────────────────────────────────────┐
│  PROBLEMA                                                      │
│  ─────────                                                     │
│  El conocimiento en ciberseguridad está fragmentado,           │
│  es técnicamente denso y no está al alcance de                 │
│  personas sin formación especializada.                         │
│                                                               │
│  SOLUCIÓN                                                      │
│  ────────                                                      │
│  Un agente de IA especializado en ciberseguridad,              │
│  accesible vía web y móvil, que se adapta al nivel             │
│  del usuario y proporciona respuestas precisas                │
│  basadas en una base de conocimiento curada.                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌟 ¿Por qué ARES?

### El contexto actual

```ascii
  🌐  500 MILLONES de ataques de malware se detectan cada día
  🔓  $10.5 TRILLONES de dólares en daños por cibercrimen (2025)
  🏥  Hospitales, escuelas y gobiernos son los blancos favoritos
  📱  El 95% de los ataques comienzan con un error humano
  📚  Solo el 30% de las personas tiene conocimientos básicos de
      ciberseguridad
```

### La oportunidad

La inteligencia artificial ha avanzado lo suficiente para crear asistentes especializados que pueden guiar a las personas en el aprendizaje y aplicación de la ciberseguridad. ARES aprovecha esta oportunidad para:

1. **Educar** — desde conceptos básicos hasta técnicas avanzadas
2. **Asistir** — en tiempo real con respuestas contextualizadas
3. **Proteger** — al empoderar a los usuarios con conocimiento
4. **Estandarizar** — usando frameworks reconocidos (OWASP, NIST, PTES)

---

## ⚙️ Cómo Funciona ARES (Demo Flow)

```ascii
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE UNA CONSULTA                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USUARIO: "¿Cómo puedo protegerme de un ataque de phishing?"     │
│                                                                  │
│  1.  Frontend captura el mensaje                                 │
│  2.  Lo envía al backend via SSE                                 │
│  3.  El agente recibe la solicitud                               │
│  4.  Pipeline de 10 pasos:                                       │
│      ├─ Normaliza el texto                                       │
│      ├─ Aplica guardrails de seguridad                           │
│      ├─ Infiere modo → LEARNING                                  │
│      ├─ Infiere tema → CYBERSECURITY                             │
│      ├─ Busca en base de conocimiento (RAG)                     │
│      ├─ Recupera historial de la sesión                          │
│      ├─ Construye el prompt completo                             │
│      ├─ Verifica rate limit                                      │
│      ├─ Consulta al LLM (NIM → Gemini → Ollama)                │
│      └─ Guarda en memoria                                        │
│  5.  Respuesta streamed letra por letra al frontend              │
│  6.  Usuario ve la respuesta en tiempo real                      │
│                                                                  │
│  ARES: "¡Excelente pregunta! El phishing es uno de los           │
│  vectores de ataque más comunes. Aquí tienes 5 señales           │
│  para identificar un correo de phishing..."                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Guión para la Presentación en el Stand

### 📢 Para el público general (30 segundos)

```
ACERCAMIENTO:

"¿Sabías que cada 11 segundos ocurre un ataque de ransomware
en el mundo? Hola, somos el equipo ARES y desarrollamos un
asistente de inteligencia artificial que te enseña y ayuda
con ciberseguridad. ¿Te gustaría ver cómo funciona?"
```

### 🎓 Para estudiantes (45 segundos)

```
EXPLICACIÓN:

"ARES es un agente de IA especializado en ciberseguridad.
Tiene 4 modos: puedes aprender desde cero, simular
auditorías de seguridad, aprender a defender sistemas,
o escribir código seguro. Todo desde tu celular o
computadora, en tiempo real. ¿Qué te gustaría preguntarle?"
```

### 🏛️ Para jurado / académicos (2 minutos)

```
PRESENTACIÓN FORMAL:

"Buenos días, soy [nombre], del equipo ARES.

ARES es un sistema de inteligencia artificial agéntica
diseñado para democratizar el acceso al conocimiento en
ciberseguridad. Utiliza una arquitectura de tres capas:
un frontend PWA desarrollado con Next.js, un backend en
FastAPI con Python, y un agente conversacional que orquesta
un pipeline de razonamiento de 10 pasos.

El sistema cuenta con:

• 4 modos de operación especializados
• Failover triple entre proveedores de IA
• Sistema RAG con base de conocimiento curada
• Guardrails de seguridad integrados
• Streaming de respuestas en tiempo real
• Memoria de conversación por sesión

El proyecto es completamente open source y está diseñado
con fines educativos. ¿Les gustaría ver una demostración?"
```

---

## 🎪 Stand Setup Recomendado

```
┌─────────────────────────────────────────────────────────────┐
│                    TU STAND ARES                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📺 MONITOR PRINCIPAL           📱 TABLET DEMO              │
│  ┌──────────────────────┐      ┌────────────────┐          │
│  │  Dashboard ARES      │      │  ARES en       │          │
│  │  corriendo en vivo   │      │  modo PWA      │          │
│  └──────────────────────┘      └────────────────┘          │
│                                                             │
│  🖨️  CÓDIGO QR                       📋 POSTER             │
│  ┌──────────┐                       ┌─────────────┐       │
│  │ Link a   │                       │ ARQUITECTURA│       │
│  │ GitHub   │                       │ DEL SISTEMA │       │
│  └──────────┘                       └─────────────┘       │
│                                                             │
│  ───────────────────────────────────────────────────        │
│  👥 EQUIPO (4 personas rotándose para presentar)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Timeline de Presentación (45 min por slot)

| Tiempo | Actividad | Responsable |
|--------|-----------|-------------|
| 0:00 - 2:00 | **Apertura** — ¿Qué es ARES? | Bruno |
| 2:00 - 4:00 | **Demo en vivo** — Pregunta del público | Bruno / Jairo |
| 4:00 - 6:00 | **Frontend** — Diseño y UX | Yered |
| 6:00 - 8:00 | **Backend** — Pipeline del agente | Jairo |
| 8:00 - 10:00 | **Seguridad** — Base de conocimiento | Axel |
| 10:00 - 15:00 | **Q&A** — Preguntas del jurado | Todo el equipo |
| 15:00 - 45:00 | **Stand abierto** — Demos individuales | Rotación |

---

## 📣 Preguntas Frecuentes (FAQ)

### ¿ARES es gratuito?
Sí, ARES es un proyecto open source con licencia MIT. Cualquier persona puede usarlo, modificarlo y distribuirlo.

### ¿Necesito saber programar para usarlo?
No. ARES está diseñado para ser accesible a cualquier persona, independientemente de su nivel técnico.

### ¿ARES puede hackear sistemas?
No. ARES promueve el hacking ético y siempre incluye advertencias legales. No realiza ataques reales.

### ¿Qué tan preciso es?
ARES combina la potencia de LLMs modernos con una base de conocimiento curada por nuestro investigador, lo que garantiza respuestas precisas y contextualizadas.

### ¿Puedo instalarlo en mi empresa?
Sí, al ser open source, puedes desplegar tu propia instancia de ARES con tu configuración.

---

## 📸 Contenido para Redes Sociales

```ascii
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏆  FERIA DE CIENCIAS IEU 2026                             ║
║                                                               ║
║   Ven a conocer ARES en el stand de                          ║
║   Ingeniería en Sistemas!                                    ║
║                                                               ║
║   🛡️  Asistente IA de Ciberseguridad                         ║
║   🤖  4 modos de operación                                   ║
║   📱  Accesible desde tu celular                             ║
║   🔓  Open Source                                           ║
║                                                               ║
║   🗓️  Feria de Ciencias IEU 2026                             ║
║   📍  IEU Universidad — Puebla                               ║
║                                                               ║
║   #ARES #Ciberseguridad #IA #IEU #FeriaDeCiencias            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 📊 Impacto Esperado

```ascii
METAS DEL PROYECTO ARES

┌─────────────────────────────────────────────────────────────┐
│                   CORTO PLAZO (Feria 2026)                    │
├─────────────────────────────────────────────────────────────┤
│  🎯  Educar a 200+ asistentes sobre ciberseguridad          │
│  🎯  Demostrar viabilidad de IA agéntica en educación        │
│  🎯  Conseguir feedback para mejoras                         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  MEDIANO PLAZO (2026-2027)                    │
├─────────────────────────────────────────────────────────────┤
│  🎯  Expandir base de conocimiento a 20+ documentos         │
│  🎯  Implementar autenticación de usuarios                   │
│  🎯  Agregar más herramientas al sistema                     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  LARGO PLAZO (2027+)                          │
├─────────────────────────────────────────────────────────────┤
│  🎯  Despliegue en instituciones educativas                  │
│  🎯  Versión multiusuario con roles                         │
│  🎯  Integración con plataformas de aprendizaje              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🙏 Agradecimientos

<div align="center">

**IEU Universidad — Puebla**

Por brindarnos el espacio y la oportunidad de presentar nuestro proyecto.

**NVIDIA NIM**

Por su programa gratuito que nos permitió potenciar ARES con modelos de última generación.

**Nuestros profesores y asesores**

Por su guía y apoyo durante todo el desarrollo.

**Tú, que nos visitas**

Por interesarte en la ciberseguridad y la inteligencia artificial.

---

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ARES — Agente de IA para Ciberseguridad                     ║
║                                                               ║
║   🦏 Bruno  ·  🎨 Yered  ·  🐍 Jairo  ·  📚 Axel             ║
║                                                               ║
║   "Porque el conocimiento en ciberseguridad no debería        ║
║    estar detrás de una pared de requisitos técnicos."         ║
║                                                               ║
║   IEU Universidad · Puebla, México · Julio 2026              ║
║   MIT License · github.com/devv-jr/ARES                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**[⬆️ Volver al índice](./index.md)**

</div>
