"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, CheckCircle, XCircle, Circle, ChevronDown, ChevronRight,
  Play, Clock, Wrench, BarChart3, Download, Target, X, AlertCircle,
  Radio, Scan, Shield, Globe, Server,
} from "lucide-react"
import Icon3D, { ICON_PALETTES } from "./Icon3D"

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

const STATUS_PALETTE = {
  pending: ICON_PALETTES.zinc,
  running: ICON_PALETTES.cyan,
  done: ICON_PALETTES.green,
  error: ICON_PALETTES.red,
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
          className="relative z-10"
        >
          <Icon3D
            icon={Icon}
            palette={STATUS_PALETTE[step.status]}
            active={step.status === "running" || step.status === "done"}
            spin={step.status === "running"}
            size="h-8 w-8"
            iconSize="h-4 w-4"
          />
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

function PlaybookModal({ playbook, targetInput, setTargetInput, onConfirm, onCancel }) {
  if (!playbook) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <Icon3D icon={Play} palette={ICON_PALETTES.purple} size="h-9 w-9" iconSize="h-4 w-4" />
            <div>
              <h2 className="text-sm font-bold tracking-wider text-zinc-200">{playbook.title}</h2>
              <p className="text-[11px] text-zinc-500">{playbook.subtitle}</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-full p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-[12px] leading-relaxed text-zinc-400">{playbook.description}</p>

          <div className="flex flex-wrap gap-3">
            {playbook.duration && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Clock className="h-3 w-3" />
                {playbook.duration}
              </span>
            )}
            {playbook.tools && playbook.tools.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Wrench className="h-3 w-3" />
                {playbook.tools.join(", ")}
              </span>
            )}
            {playbook.badge && (
              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">{playbook.badge}</span>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Pasos</p>
            <div className="space-y-1">
              {playbook.steps?.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="text-zinc-700 font-mono">{i + 1}.</span>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              <Target className="h-3 w-3" />
              Objetivo (IP / hostname)
            </label>
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Ej: 192.168.1.15 o scanme.nmap.org"
              className="w-full rounded-lg border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              autoFocus
            />
            <p className="text-[10px] text-zinc-600 mt-1">Déjalo vacío si el playbook usa su propio entorno Docker.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(targetInput.trim())}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
          >
            <Play className="h-3 w-3" />
            Ejecutar Playbook
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PipelineReport({ report, onBack }) {
  if (!report) return null

  const getStepIcon = (type) => {
    switch (type) {
      case "ping": return Radio
      case "docker_deploy": return Server
      case "command": return TerminalIcon
      case "llm_analyze": return Scan
      case "docker_destroy": return Shield
      default: return Circle
    }
  }

  const TerminalIcon = Globe

  function downloadReport() {
    const text = [
      `=== ${report.title} ===`,
      `Target: ${report.targetIp || "N/A"}`,
      `Herramientas: ${(report.tools || []).join(", ")}`,
      "",
      "--- Resultados ---",
      ...(report.stepResults || []).map((s) =>
        `[${s.name}]\n${s.output || "Sin salida"}\n`
      ),
      "",
      "--- Análisis ARES ---",
      report.analysis || "Sin análisis disponible.",
    ].join("\n")

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-${report.title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl"
    >
      <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-green-400">REPORTE COMPLETADO</span>
            <h3 className="text-sm font-bold text-zinc-200 mt-0.5">{report.title}</h3>
          </div>
          <Icon3D icon={BarChart3} palette={ICON_PALETTES.green} active size="h-10 w-10" iconSize="h-5 w-5" />
        </div>
        {report.targetIp && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-400">
            <Target className="h-3 w-3 text-cyan-400" />
            Objetivo: <span className="font-mono text-cyan-300">{report.targetIp}</span>
          </div>
        )}
      </div>

      <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4 max-h-[400px] overflow-y-auto space-y-3">
        {(report.stepResults || []).map((step, i) => {
          const StepIcon = getStepIcon(step.type)
          return (
            <div key={step.id} className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <StepIcon className="h-3 w-3 text-green-500" />
                <span className="text-xs font-semibold text-zinc-300">{step.name}</span>
                <span className="text-[10px] text-green-600 ml-auto">✓</span>
              </div>
              {step.output && (
                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">{step.output.slice(0, 300)}</p>
              )}
            </div>
          )
        })}

        {report.analysis && (
          <div className="rounded-lg border border-purple-900/40 bg-purple-950/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Scan className="h-3 w-3 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Análisis de ARES</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{report.analysis}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Volver a playbooks
        </button>
        <button
          onClick={downloadReport}
          className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
        >
          <Download className="h-3 w-3" />
          Guardar evidencia
        </button>
      </div>
    </motion.div>
  )
}

export default function PipelineView() {
  const [prompts, setPrompts] = useState([])
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [steps, setSteps] = useState([])
  const [running, setRunning] = useState(false)
  const [pipelineTitle, setPipelineTitle] = useState("")
  const abortRef = useRef(false)

  const [showModal, setShowModal] = useState(false)
  const [playbookToRun, setPlaybookToRun] = useState(null)
  const [targetInput, setTargetInput] = useState("")
  const [report, setReport] = useState(null)

  const goBack = useCallback(() => {
    setSteps([])
    setRunning(false)
    setSelectedPrompt(null)
    setPipelineTitle("")
    setReport(null)
    setShowModal(false)
    setPlaybookToRun(null)
    setTargetInput("")
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/pipeline/prompts`)
      .then((r) => r.json())
      .then(setPrompts)
      .catch(() => setPrompts([]))
  }, [])

  function openPlaybookModal(p) {
    setPlaybookToRun(p)
    setTargetInput("")
    setReport(null)
    setShowModal(true)
  }

  function confirmPipeline(target) {
    setShowModal(false)
    startPipeline(playbookToRun.id, target)
  }

  const startPipeline = useCallback(async (promptId, target) => {
    abortRef.current = false
    setRunning(true)
    setSteps([])
    setSelectedPrompt(promptId)
    setReport(null)

    try {
      const res = await fetch(`${API_URL}/pipeline/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_id: promptId, target: target || null }),
      })

      if (!res.ok || !res.body) {
        setSteps((prev) => [...prev, { id: prev.length, name: "Error", status: "error", error: `HTTP ${res.status}`, logs: [] }])
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

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
            handleEvent(event)
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

  function handleEvent(event) {
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
      case "pipeline:report": {
        setReport(event)
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

        {!running && report && <PipelineReport report={report} onBack={goBack} />}

        {!running && !report && steps.length > 0 && (
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
    <>
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
                  onClick={() => openPlaybookModal(p)}
                  className="group flex flex-col items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-left transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-950/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40"
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <Icon3D icon={Play} palette={ICON_PALETTES.purple} size="h-9 w-9" iconSize="h-4 w-4" />
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

      <AnimatePresence>
        {showModal && playbookToRun && (
          <PlaybookModal
            playbook={playbookToRun}
            targetInput={targetInput}
            setTargetInput={setTargetInput}
            onConfirm={confirmPipeline}
            onCancel={() => { setShowModal(false); setPlaybookToRun(null) }}
          />
        )}
      </AnimatePresence>
    </>
  )
}