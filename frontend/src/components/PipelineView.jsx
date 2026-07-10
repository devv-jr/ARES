"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle, XCircle, Circle, ChevronDown, ChevronRight, Play, Clock, Wrench, BarChart3 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const STATUS_ICON = {
  pending: Circle,
  running: Loader2,
  done: CheckCircle,
  error: XCircle,
}

const STATUS_COLOR = {
  pending: "text-zinc-600",
  running: "text-cyan-400",
  done: "text-green-400",
  error: "text-red-400",
}

function StepCard({ step, index, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = STATUS_ICON[step.status] || Circle
  const color = STATUS_COLOR[step.status] || "text-zinc-600"

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 ${color}`}
        >
          <Icon className={`h-4 w-4 ${step.status === "running" ? "animate-spin" : ""}`} />
        </motion.div>
        {!isLast && <div className="mt-1 h-full w-px bg-zinc-800" />}
      </div>

      <div className="flex-1 pb-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${color}`}>{step.name}</span>
              {step.status === "running" && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  CORRIENDO
                </span>
              )}
              {step.status === "done" && (
                <span className="text-[10px] text-green-500">COMPLETADO</span>
              )}
              {step.status === "error" && (
                <span className="text-[10px] text-red-500">ERROR</span>
              )}
            </div>
            {step.logs.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                LOG
              </button>
            )}
          </div>

          {step.description && step.status === "pending" && (
            <p className="mt-1 text-[11px] text-zinc-600">{step.description}</p>
          )}

          {step.error && (
            <p className="mt-2 text-[11px] text-red-400 break-words">{step.error}</p>
          )}

          {step.result && step.status === "done" && (
            <p className="mt-1 text-[11px] text-zinc-500 truncate">{step.result}</p>
          )}

          <AnimatePresence>
            {expanded && step.logs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 max-h-40 overflow-y-auto rounded bg-black/60 p-2 font-mono text-[11px] leading-relaxed text-zinc-400">
                  {step.logs.map((log, li) => (
                    <div key={li} className="whitespace-pre-wrap break-words">
                      <span className="text-zinc-600">[{li + 1}]</span> {log}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default function PipelineView() {
  const [prompts, setPrompts] = useState([])
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [steps, setSteps] = useState([])
  const [running, setRunning] = useState(false)
  const [pipelineTitle, setPipelineTitle] = useState("")
  const abortRef = useRef(false)

  const goBack = useCallback(() => {
    setSteps([])
    setRunning(false)
    setSelectedPrompt(null)
    setPipelineTitle("")
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/pipeline/prompts`)
      .then((r) => r.json())
      .then(setPrompts)
      .catch(() => setPrompts([]))
  }, [])

  const startPipeline = useCallback(async (promptId) => {
    abortRef.current = false
    setRunning(true)
    setSteps([])
    setSelectedPrompt(promptId)

    try {
      const res = await fetch(`${API_URL}/pipeline/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_id: promptId }),
      })

      if (!res.ok || !res.body) {
        setSteps((prev) => [...prev, { id: prev.length, name: "Error", status: "error", error: `HTTP ${res.status}`, logs: [] }])
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let stepMap = {}

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (abortRef.current) {
          reader.cancel()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const rawEvent of events) {
          const line = rawEvent.trim()
          if (!line.startsWith("data: ")) continue
          const payload = line.slice("data: ".length)
          if (payload === "[DONE]") continue

          try {
            const event = JSON.parse(payload)
            handleEvent(event, stepMap)
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      setSteps((prev) => [...prev, { id: prev.length, name: "Error de conexión", status: "error", error: err.message, logs: [] }])
    } finally {
      setRunning(false)
    }
  }, [])

  function handleEvent(event, stepMap) {
    switch (event.type) {
      case "pipeline:start": {
        setPipelineTitle(event.title)
        const initialSteps = (event.steps || []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          status: "pending",
          logs: [],
          error: null,
          result: null,
        }))
        setSteps(initialSteps)
        initialSteps.forEach((s) => { stepMap[s.id] = s })
        break
      }
      case "step:start": {
        setSteps((prev) =>
          prev.map((s) => (s.id === event.id ? { ...s, status: "running" } : s))
        )
        break
      }
      case "step:log": {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === event.id ? { ...s, logs: [...s.logs, event.message] } : s
          )
        )
        break
      }
      case "step:done": {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === event.id
              ? { ...s, status: "done", result: event.result?.summary || event.result?.output || event.result?.status || "OK" }
              : s
          )
        )
        break
      }
      case "step:error": {
        setSteps((prev) =>
          prev.map((s) => (s.id === event.id ? { ...s, status: "error", error: event.error } : s))
        )
        break
      }
      case "pipeline:error": {
        setSteps((prev) => [...prev, { id: "error", name: "Error", status: "error", error: event.error, logs: [] }])
        break
      }
      case "pipeline:done": {
        break
      }
    }
  }

  if (steps.length > 0 || running) {
    return (
      <div className="w-full max-w-3xl font-mono">
        <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-400 font-semibold">{pipelineTitle}</span>
            <span className="text-zinc-500">{running ? "EJECUTANDO" : "COMPLETADO"}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-zinc-600">
            <span>
              ESTADO:{" "}
              <span className={running ? "text-cyan-400" : "text-green-400"}>
                {running ? "EN PROGRESO" : "FINALIZADO"}
              </span>
            </span>
            <span>{steps.filter((s) => s.status === "done").length}/{steps.length} pasos</span>
          </div>
        </div>

        <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4 max-h-[500px] overflow-y-auto">
          {steps.length === 0 && running && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              Iniciando pipeline...
            </div>
          )}
          {steps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} isLast={i === steps.length - 1} />
          ))}
        </div>

        {!running && steps.length > 0 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Volver a playbooks
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl font-mono">
      <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-400 font-semibold">PLAYBOOKS</span>
          <span className="text-zinc-500">Automatización visual</span>
        </div>
        <div className="text-[10px] text-zinc-600">
          Selecciona un playbook para ejecutar un pipeline automatizado de seguridad.
        </div>
      </div>

      <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4 max-h-[500px] overflow-y-auto">
        {prompts.length === 0 ? (
          <p className="text-sm text-zinc-600">
            <span className="text-zinc-500">[SISTEMA]</span> No hay playbooks disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prompts.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                onClick={() => startPipeline(p.id)}
                className="group flex flex-col items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-950/80"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-purple-400">
                    <Play className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-bold tracking-wider text-zinc-200">{p.title}</span>
                  {p.badge && (
                    <span className="ml-auto rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">{p.badge}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-zinc-300">{p.subtitle}</span>
                <p className="text-[11px] leading-relaxed text-zinc-500 group-hover:text-zinc-400 line-clamp-2">{p.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {p.duration && (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Clock className="h-3 w-3" />
                      {p.duration}
                    </span>
                  )}
                  {p.tools && p.tools.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Wrench className="h-3 w-3" />
                      {p.tools.join(", ")}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
