"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, CheckCircle, XCircle, Circle, ChevronDown, ChevronRight,
  Play, Clock, Wrench, BarChart3, Download, Target, X,
  Radio, Scan, Shield, Globe, Server, Zap, Activity,
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

// ── Glow ring for completed steps ──────────────────────────
function StepGlow({ status }) {
  if (status !== "done") return null
  return (
    <span className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
  )
}

// ── Terminal scan line overlay ─────────────────────────────
function ScanLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-[0.04]">
      <div className="scan-line h-px w-full bg-green-400" />
    </div>
  )
}

// ── Progress bar with animated gradient ────────────────────
function AnimatedProgress({ done, total, active }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-800">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 via-green-400 to-emerald-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {active && (
        <div className="absolute inset-y-0 left-0 w-full animate-pulse">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
    </div>
  )
}

// ── Particle burst on step complete ────────────────────────
function ParticleBurst({ active }) {
  if (!active) return null
  const particles = Array.from({ length: 8 })
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((_, i) => {
        const angle = (i / 8) * 360
        return (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-green-400"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 16, y: Math.sin(angle) * 16, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )
      })}
    </span>
  )
}

// ── Typewriter text ────────────────────────────────────────
function TypewriterText({ text, className }) {
  const [displayed, setDisplayed] = useState("")
  const idxRef = useRef(0)

  useEffect(() => {
    idxRef.current = 0
    setDisplayed("")
    const interval = setInterval(() => {
      idxRef.current += 1
      setDisplayed(text.slice(0, idxRef.current))
      if (idxRef.current >= text.length) clearInterval(interval)
    }, 8)
    return () => clearInterval(interval)
  }, [text])

  return <span className={className}>{displayed}</span>
}

// ── Step Card (same UI, added glow + particle) ─────────────
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
          <StepGlow status={step.status} />
          <ParticleBurst active={step.status === "done"} />
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
          className={`relative overflow-hidden rounded-lg border p-3 ${
            step.status === "done"
              ? "border-green-900/40 bg-green-950/20"
              : step.status === "error"
              ? "border-red-900/40 bg-red-950/20"
              : step.status === "running"
              ? "border-cyan-900/40 bg-cyan-950/10"
              : "border-zinc-800 bg-zinc-950/60"
          }`}
        >
          <ScanLines />
          <div className="relative z-10">
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
                  <span className="flex items-center gap-1 text-[10px] text-green-500">
                    <Zap className="h-3 w-3" />
                    COMPLETADO
                  </span>
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
          </div>

          <AnimatePresence>
            {expanded && step.logs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden relative"
              >
                <div className="mt-2 max-h-40 overflow-y-auto rounded bg-black/70 p-2 font-mono text-[11px] leading-relaxed text-green-300/80">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />
                  {step.logs.map((log, li) => (
                    <div key={li} className="whitespace-pre-wrap break-words hover:text-green-200 transition-colors">
                      <span className="text-zinc-600">[{String(li + 1).padStart(2, "0")}]</span> {log}
                    </div>
                  ))}
                  {step.status === "running" && (
                    <span className="inline-block h-3 w-1.5 bg-green-400/60 animate-pulse ml-0.5" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

// ── Playbook Modal ─────────────────────────────────────────
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
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-cyan-950/10 pointer-events-none" />

          <div className="relative z-10">
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
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Pipeline Report with typewriter analysis ───────────────
function PipelineReport({ report, onBack }) {
  if (!report) return null

  const getStepIcon = (type) => {
    switch (type) {
      case "ping": return Radio
      case "docker_deploy": return Server
      case "command": return Globe
      case "llm_analyze": return Scan
      case "docker_destroy": return Shield
      default: return Circle
    }
  }

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
      className="w-full max-w-3xl mt-4"
    >
      <div className="rounded-t-lg border border-green-900/50 bg-gradient-to-r from-zinc-950 via-green-950/20 to-zinc-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
              <Zap className="h-3 w-3" />
              REPORTE COMPLETADO
            </span>
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
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3 hover:border-zinc-700/60 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <StepIcon className="h-3 w-3 text-green-500" />
                <span className="text-xs font-semibold text-zinc-300">{step.name}</span>
                <span className="text-[10px] text-green-600 ml-auto">✓</span>
              </div>
              {step.output && (
                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">{step.output.slice(0, 300)}</p>
              )}
            </motion.div>
          )
        })}

        {report.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-purple-900/50 bg-gradient-to-br from-purple-950/20 to-zinc-950/60 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Scan className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Análisis de ARES</span>
            </div>
            <div className="text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-light">
              <TypewriterText text={report.analysis} />
            </div>
          </motion.div>
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
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-900/30"
        >
          <Download className="h-3 w-3" />
          Guardar evidencia
        </button>
      </div>
    </motion.div>
  )
}

// ── Main PipelineView ──────────────────────────────────────
export default function PipelineView() {
  const [playbooks, setPlaybooks] = useState([])
  const [steps, setSteps] = useState([])
  const [running, setRunning] = useState(false)
  const [pipelineTitle, setPipelineTitle] = useState("")
  const abortRef = useRef(false)

  const [showModal, setShowModal] = useState(false)
  const [playbookToRun, setPlaybookToRun] = useState(null)
  const [targetInput, setTargetInput] = useState("")
  const [report, setReport] = useState(null)
  const [playbookResult, setPlaybookResult] = useState(null)
  const stepOutputsRef = useRef({})

  const goBack = useCallback(() => {
    setSteps([])
    setRunning(false)
    setPipelineTitle("")
    setReport(null)
    setShowModal(false)
    setPlaybookToRun(null)
    setTargetInput("")
    setPlaybookResult(null)
    stepOutputsRef.current = {}
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/playbooks`)
      .then((r) => r.json())
      .then(setPlaybooks)
      .catch(() => { fetch(`${API_URL}/pipeline/prompts`).then((r) => r.json()).then(setPlaybooks).catch(() => setPlaybooks([])) })
  }, [])

  function openPlaybookModal(p) {
    setPlaybookToRun(p)
    setTargetInput("")
    setReport(null)
    setPlaybookResult(null)
    stepOutputsRef.current = {}
    setShowModal(true)
  }

  function confirmPipeline(target) {
    setShowModal(false)
    startPlaybook(playbookToRun.id, target, playbookToRun)
  }

  const startPlaybook = useCallback(async (playbookId, target, playbook) => {
    abortRef.current = false
    setRunning(true)
    setSteps([])
    setPipelineTitle(playbook?.title || playbookId)
    setReport(null)
    setPlaybookResult(null)
    stepOutputsRef.current = {}

    const stepMap = {}
    if (playbook?.steps) {
      const initialSteps = playbook.steps.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        status: "pending",
        logs: [],
        error: null,
        result: null,
      }))
      setSteps(initialSteps)
      initialSteps.forEach((s) => { stepMap[s.id] = s })
    }

    try {
      const res = await fetch(`${API_URL}/playbooks/${playbookId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target || "" }),
      })

      if (!res.ok || !res.body) {
        setSteps((prev) => [...prev, { id: "error", name: "Error", status: "error", error: `HTTP ${res.status}`, logs: [] }])
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
            handlePlaybookEvent(event, stepMap, playbook)
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setSteps((prev) => [...prev, { id: "error", name: "Error de conexión", status: "error", error: err.message, logs: [] }])
    } finally {
      setRunning(false)
    }
  }, [])

  function ensureStep(id, name, stepMap) {
    if (!stepMap[id]) {
      const newStep = { id, name: name || id, description: "", status: "pending", logs: [], error: null, result: null }
      stepMap[id] = newStep
      setSteps((prev) => [...prev, newStep])
    }
    return stepMap[id]
  }

  function handlePlaybookEvent(event, stepMap, playbook) {
    switch (event.type) {
      case "step_start": {
        ensureStep(event.step_id, event.step_name, stepMap)
        setSteps((prev) => prev.map((s) => (s.id === event.step_id ? { ...s, status: "running" } : s)))
        break
      }
      case "step_output": {
        ensureStep(event.step_id, event.step_name, stepMap)
        const data = typeof event.data === "string" ? event.data : JSON.stringify(event.data)
        stepOutputsRef.current[event.step_id] = (stepOutputsRef.current[event.step_id] || "") + data + "\n"
        setSteps((prev) =>
          prev.map((s) => (s.id === event.step_id ? { ...s, logs: [...s.logs, data] } : s))
        )
        break
      }
      case "step_end": {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === event.step_id
              ? { ...s, status: "done", result: s.logs?.[s.logs.length - 1] || "OK" }
              : s
          )
        )
        break
      }
      case "error": {
        const data = typeof event.data === "string" ? event.data : "Error en el pipeline"
        if (event.step_id) {
          ensureStep(event.step_id, event.step_name, stepMap)
          setSteps((prev) =>
            prev.map((s) => (s.id === event.step_id ? { ...s, status: "error", error: data, logs: [...s.logs, data] } : s))
          )
        } else {
          setSteps((prev) => [...prev, { id: "error", name: "Error", status: "error", error: data, logs: [] }])
        }
        break
      }
      case "playbook_end": {
        const success = event.data === "success"
        setPlaybookResult(success ? "success" : "failed")
        if (success && playbook) {
          const toolNames = playbook.tools || []
          const stepResults = (playbook.steps || []).map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            output: stepOutputsRef.current[s.id] || "",
          }))
          const analysisData = Object.entries(stepOutputsRef.current).find(
            ([, v]) => v.toLowerCase().includes("vulnerabilidad") || v.toLowerCase().includes("recomendacion") || v.toLowerCase().includes("mitigación")
          )?.[1] || ""
          const lastOutputs = Object.values(stepOutputsRef.current)
          const analysis = analysisData || lastOutputs[lastOutputs.length - 1] || ""
          setReport({
            title: playbook.title,
            targetIp: targetInput || "",
            tools: toolNames,
            stepResults,
            analysis,
          })
        }
        break
      }
    }
  }

  // ── Render: running / results view ──────────────────────
  if (steps.length > 0 || running) {
    const doneCount = steps.filter((s) => s.status === "done").length
    const totalCount = steps.length

    return (
      <div className="w-full max-w-3xl font-mono">
        <div className={`relative overflow-hidden rounded-t-lg border px-4 py-2 ${
          running
            ? "border-cyan-900/40 bg-gradient-to-r from-zinc-950 via-cyan-950/10 to-zinc-950"
            : playbookResult === "success"
            ? "border-green-900/40 bg-gradient-to-r from-zinc-950 via-green-950/10 to-zinc-950"
            : playbookResult === "failed"
            ? "border-red-900/40 bg-gradient-to-r from-zinc-950 via-red-950/10 to-zinc-950"
            : "border-zinc-800 bg-zinc-950/80"
        }`}>
          <AnimatedProgress done={doneCount} total={totalCount} active={running} />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={`font-semibold ${running ? "text-cyan-400" : playbookResult === "success" ? "text-green-400" : "text-zinc-300"}`}>
              {running && <Activity className="inline h-3 w-3 mr-1 animate-pulse" />}
              {pipelineTitle}
            </span>
            <span className="text-zinc-500">{running ? "EJECUTANDO" : playbookResult === "success" ? "COMPLETADO" : "FINALIZADO"}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-zinc-600 mt-0.5">
            <span>
              ESTADO:{" "}
              <span className={
                running ? "text-cyan-400" : playbookResult === "success" ? "text-green-400" : "text-red-400"
              }>
                {running ? "EN PROGRESO" : playbookResult === "success" ? "FINALIZADO" : "FALLIDO"}
              </span>
            </span>
            <span>{doneCount}/{totalCount} pasos</span>
            {running && (
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" />
                <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping delay-150" />
                <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping delay-300" />
              </span>
            )}
          </div>
        </div>

        <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4 max-h-[500px] overflow-y-auto">
          {steps.length === 0 && running && (
            <div className="relative flex items-center gap-3 text-sm text-zinc-500 py-8 justify-center">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <span className="text-[80px] font-bold text-green-500 select-none">ARES</span>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <span>Iniciando pipeline...</span>
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

  // ── Render: playbook grid ───────────────────────────────
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
          {playbooks.length === 0 ? (
            <p className="text-sm text-zinc-600">
              <span className="text-zinc-500">[SISTEMA]</span> No hay playbooks disponibles.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playbooks.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  onClick={() => openPlaybookModal(p)}
                  className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-left transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-950/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-950/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10 w-full">
                    <div className="flex items-center gap-2.5 w-full">
                      <Icon3D icon={Play} palette={ICON_PALETTES.purple} size="h-9 w-9" iconSize="h-4 w-4" />
                      <span className="text-sm font-bold tracking-wider text-zinc-200">{p.title}</span>
                      {p.badge && (
                        <span className="ml-auto rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">{p.badge}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 mt-1 block">{p.subtitle}</span>
                    <p className="text-[11px] leading-relaxed text-zinc-500 group-hover:text-zinc-400 line-clamp-2 mt-1">{p.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
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
