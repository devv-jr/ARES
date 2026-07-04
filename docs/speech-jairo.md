
```ascii
     ██╗ █████╗ ██╗██████╗  ██████╗
     ██║██╔══██╗██║██╔══██╗██╔═══██╗
     ██║███████║██║██████╔╝██║   ██║
██   ██║██╔══██║██║██╔══██╗██║   ██║
╚█████╔╝██║  ██║██║██║  ██║╚██████╔╝
 ╚════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝
```

<div align="center">

# 🎤 Guion de Presentación — Jairo

## *Backend Developer & Python Specialist*

<br>

![Speaker](https://img.shields.io/badge/SPEAKER-JAIRO-00ff41?style=for-the-badge&labelColor=0d0d0d)
![Role](https://img.shields.io/badge/ROL-BACKEND%20%26%20AGENTE-00b4d8?style=for-the-badge&labelColor=0d0d0d)
![Duration](https://img.shields.io/badge/DURACIÓN-2.5%20MIN-00ff41?style=for-the-badge&labelColor=0d0d0d)

</div>

---

## 📋 Resumen del Speech

| Aspecto | Detalle |
|---------|---------|
| **Audiencia** | Jurado técnico, estudiantes de sistemas, asistentes |
| **Duración** | ~2.5 minutos |
| **Enfoque** | Pipeline del agente, lógica de IA, funcionamiento interno |
| **Tono** | Técnico pero accesible, didáctico |

---

## 🎭 Speech Completo

---

### 🎬 Apertura (0:00 - 0:30)

```ascii
> INICIALIZANDO SPEECH...
> CARGANDO PIPELINE... [OK]
> MODO: EXPLICACIÓN TÉCNICA
```

**Jairo:** *(con una laptop abierta mostrando código Python)*

> Hola, soy **Jairo** y soy el responsable de lo que pasa **detrás del telón** en ARES.
>
> Verán, cuando Bruno y Yered construyen lo que se ve, yo construyo lo que **piensa**. El cerebro de ARES.
>
> Y no es un cerebro sencillo. Déjenme contarles cómo funciona realmente.

---

### 🧠 El Pipeline del Agente (0:30 - 1:30)

**Jairo:**

> Cuando alguien escribe un mensaje en ARES, no solo lo mandamos a ChatGPT y ya. Hay un **proceso de 10 pasos** que corre en milisegundos.
>
> *(Señala el código en la pantalla)*
>
> **Paso 1:** Normalizamos la entrada — quitamos espacios, limpiamos el texto.
>
> **Paso 2:** Pasamos por **guardrails**. ¿El usuario está intentando hacer algo peligroso? ¿Está pidiendo algo éticamente cuestionable? Lo detectamos y manejamos.
>
> *(Los dedos cuentan)*
>
> **Paso 3:** **Inferimos el modo**. ¿El usuario quiere aprender? ¿Está auditando? ¿Defendiendo? ¿Programando? El sistema lo detecta automáticamente si no lo especifica.
>
> **Paso 4:** **Inferimos el tema**. ¿Habla de Linux? ¿De Windows? ¿De OWASP? Buscamos en nuestra base de conocimiento cuál documento es el más relevante.
>
> **Pasos 5 al 7:** Construimos el contexto, recuperamos el historial de la conversación, y armamos el mensaje completo para el LLM.
>
> **Paso 8:** **Rate limiting** — controlamos que no se abuse del sistema (35 respuestas por minuto).
>
> **Paso 9:** **La llamada al LLM** — aquí es donde ocurre la magia.
>
> **Paso 10:** Guardamos la conversación en memoria para que ARES recuerde el contexto.

---

### 🔄 Failover Triple (1:30 - 2:10)

**Jairo:**

> *(Con una sonrisa de orgullo)*
>
> Esto es algo que me gusta especialmente. ARES tiene un sistema de **failover triple**:
>
> ```
> 🥇 NVIDIA NIM → 🥈 Google Gemini → 🥉 Ollama (Local)
> ```
>
> Intentamos con el mejor servicio disponible. ¿Falló? Sin problema, automáticamente saltamos al siguiente. ¿Falló ese? Usamos uno local.
>
> **ARES nunca se queda sin respuesta.** Así de simple.
>
> Y todo esto ocurre con **streaming en tiempo real**. Cuando ves el texto aparecer letra por letra en la pantalla, eso es porque implementamos **Server-Sent Events** — el backend va mandando la respuesta en pedacitos mientras el modelo la genera. No tienes que esperar a que termine para empezar a leer.

---

### 📚 El Sistema RAG (2:10 - 2:30)

**Jairo:**

> Pero un LLM genérico no sabe de ciberseguridad. Por eso construimos un **sistema RAG** — Retrieval Augmented Generation.
>
> Tenemos una base de conocimiento con más de **9 documentos técnicos**: Linux, Windows, OWASP Top 10, herramientas de hacking ético, guías de persistencia en Windows, respuesta a incidentes en Linux...
>
> Cuando haces una pregunta, ARES busca en estos documentos las partes más relevantes usando un algoritmo de **keyword matching**, y las inyecta en el prompt para que el modelo responda con información precisa y verificada.
>
> *(Cierra la laptop)*
>
> No es magia. Es **ingeniería**.

---

### 🔚 Cierre (2:30 - 2:40)

**Jairo:**

> *(Mira al público con confianza)*
>
> ARES es un ejemplo de lo que se puede lograr cuando entiendes cómo funciona la inteligencia artificial y la aplicas con propósito.
>
> No es solo un chatbot. Es un **sistema agéntico** que piensa, recuerda, aprende y se adapta.
>
> Y lo construimos desde cero. Con Python. Con código limpio. Con mucho café.
>
> *(Ríe)*
>
> Gracias.

---

## 💡 Frases clave para destacar

> *"ARES sigue un pipeline de 10 pasos. No es magia, es ingeniería."*

> *"Si un servicio de IA falla, ARES automáticamente usa otro. Nunca se queda sin respuesta."*

> *"El streaming no es solo un efecto visual — es tecnología Server-Sent Events en tiempo real."*

> *"Nuestro sistema RAG le da a ARES conocimiento especializado en ciberseguridad que un ChatGPT normal no tiene."*

---

## 🎯 Posibles preguntas del jurado y respuestas

| Pregunta | Respuesta |
|----------|-----------|
| *¿Por qué no usan directamente ChatGPT?* | Porque necesitamos control sobre el pipeline, los guardrails, la memoria, el RAG y los modos especializados. ChatGPT es genérico; ARES está diseñado para ciberseguridad. |
| *¿Cómo manejan la concurrencia?* | La memoria de sesión es thread-safe con locks. El rate limiter usa token bucket. FastAPI maneja asyncio para peticiones concurrentes. |
| *¿Qué pasa si todos los LLM fallan?* | Devolvemos un mensaje claro indicando la situación, pero con el failover triple es extremadamente raro que todos fallen simultáneamente. |
| *¿Cuánto cuesta mantener los LLM?* | NVIDIA NIM tiene un tier gratuito de 40 RPM. Gemini también tiene capa gratuita. Ollama es completamente local. El costo operativo es mínimo. |

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🐍 Jairo — Backend Developer & Python Specialist            ║
║   "Un buen backend es como un buen chiste:                    ║
║    si tienes que explicarlo, no es tan bueno."                ║
║                                                               ║
║   IEU Universidad · Puebla · 2026                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**[<< Volver al índice](./index.md)** • **[Ver speech de Axel →](./speech-axel.md)**

</div>
