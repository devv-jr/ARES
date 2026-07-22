"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield, Globe, ScrollText, Radio, Swords,
  Loader2, CheckCircle, XCircle, Circle,
  ChevronDown, ChevronRight, Play, Clock,
  Download, ArrowLeft, Activity, Zap,
  FileText, File as FilePdf,
  AlertTriangle, Target,
  Scan, Server, Wrench,
  Bug, FlaskConical,
} from "lucide-react"
import Icon3D, { ICON_PALETTES } from "./Icon3D"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const MISSION_ICONS = {
  shield: Shield,
  globe: Globe,
  scroll: ScrollText,
  radio: Radio,
  bug: Bug,
  swords: Swords,
}

const CATEGORY_META = {
  blue_team: { label: "Blue Team", palette: ICON_PALETTES["blue-team"], icon: Shield },
  red_team: { label: "Red Team", palette: ICON_PALETTES["red-team"], icon: Swords },
  dfir: { label: "DFIR / Forense", palette: ICON_PALETTES.purple, icon: Scan },
}

const DIFFICULTY_META = {
  beginner: { label: "Principiante", color: "text-green-500", dot: "bg-green-500" },
  intermediate: { label: "Intermedio", color: "text-amber-400", dot: "bg-amber-400" },
  advanced: { label: "Avanzado", color: "text-red-400", dot: "bg-red-400" },
}

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

function SectionLabel({ children }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
      {children}
    </p>
  )
}

function StepGlow({ status }) {
  if (status !== "done") return null
  return (
    <span className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
  )
}

function ScanLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-[0.04]">
      <div className="scan-line h-px w-full bg-green-400" />
    </div>
  )
}

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

function MissionStepCard({ step, index, isLast }) {
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
                <div className="mt-2 max-h-40 overflow-y-auto rounded bg-black/70 p-2 font-mono text-[11px] leading-relaxed">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />
                  <div className="whitespace-pre-wrap break-words text-green-300/80">
                    {step.logs.join("")}
                    {step.status === "running" && (
                      <span className="inline-block h-3 w-1.5 bg-green-400/60 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function getMissionIcon(mission) {
  const iconStr = mission.icon || "shield"
  return MISSION_ICONS[iconStr] || Shield
}

function getCategoryMeta(mission) {
  return CATEGORY_META[mission.category] || CATEGORY_META.blue_team
}

function getDifficultyMeta(mission) {
  return DIFFICULTY_META[mission.difficulty] || DIFFICULTY_META.beginner
}

function getModeFromCategory(category) {
  if (category === "red_team") return "red_team"
  if (category === "dfir") return "blue_team"
  return "blue_team"
}

export default function MissionBuilderView() {
  const [view, setView] = useState("catalog")
  const [missions, setMissions] = useState([])
  const [selectedMission, setSelectedMission] = useState(null)
  const [steps, setSteps] = useState([])
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState(null)
  const [runStatus, setRunStatus] = useState(null)
  const [reportUrls, setReportUrls] = useState(null)
  const [loadingMissions, setLoadingMissions] = useState(true)
  const abortRef = useRef(false)
  const stepOutputsRef = useRef({})

  useEffect(() => {
    fetch(`${API_URL}/missions`)
      .then((r) => r.json())
      .then((data) => {
        setMissions(data)
        setLoadingMissions(false)
      })
      .catch(() => setLoadingMissions(false))
  }, [])

  function goToCatalog() {
    setView("catalog")
    setSelectedMission(null)
    setSteps([])
    setRunning(false)
    setRunId(null)
    setRunStatus(null)
    setReportUrls(null)
    stepOutputsRef.current = {}
  }

  async function handleSelectMission(mission) {
    try {
      const res = await fetch(`${API_URL}/missions/${mission.id}`)
      if (res.ok) {
        const detail = await res.json()
        setSelectedMission(detail)
        setView("detail")
        setSteps([])
        setRunning(false)
        setRunId(null)
        setRunStatus(null)
        setReportUrls(null)
        stepOutputsRef.current = {}
      }
    } catch {}
  }

  function handleStartMission() {
    if (!selectedMission) return
    setView("execution")
    startMissionRun(selectedMission)
  }

  const startMissionRun = useCallback(async (mission) => {
    abortRef.current = false
    setRunning(true)
    setSteps([])
    setRunId(null)
    setRunStatus(null)
    setReportUrls(null)
    stepOutputsRef.current = {}

    const stepMap = {}
    if (mission?.steps) {
      const initialSteps = mission.steps.map((s) => ({
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
      const mode = getModeFromCategory(mission.category)
      const res = await fetch(`${API_URL}/missions/${mission.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "", mode }),
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
            handleMissionEvent(event, stepMap)
          } catch {}
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

  function handleMissionEvent(event, stepMap) {
    switch (event.type) {
      case "run_meta": {
        const data = event.data
        if (data && data.run_id && !data.report_md) {
          setRunId(data.run_id)
        }
        if (data && data.report_md) {
          setReportUrls({ md: data.report_md, pdf: data.report_pdf })
          setRunStatus(data.status)
        }
        break
      }
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
        const data = typeof event.data === "string" ? event.data : "Error en la misión"
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
        setRunStatus(event.data === "success" ? "success" : "failed")
        break
      }
    }
  }

  // ── CATALOG VIEW ──────────────────────────────────────
  function renderCatalog() {
    const grouped = {}
    missions.forEach((m) => {
      const cat = m.category || "other"
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(m)
    })

    const categoryOrder = ["blue_team", "red_team", "dfir"]
    const sortedCategories = categoryOrder.filter((c) => grouped[c])

    return (
      <div className="w-full max-w-3xl font-mono">
        <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-green-400 font-semibold">
              <Swords className="h-3.5 w-3.5" />
              MISSION BUILDER
            </span>
            <span className="text-zinc-500">{missions.length} misiones</span>
          </div>
          <div className="text-[10px] text-zinc-600">
            Selecciona una misión para ejecutar un pipeline automatizado de seguridad.
          </div>
        </div>

        <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4 max-h-[60vh] overflow-y-auto">
          {loadingMissions ? (
            <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Cargando misiones...</span>
            </div>
          ) : missions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-600">
              <Swords className="h-8 w-8" />
              <p className="text-xs">No hay misiones disponibles.</p>
            </div>
          ) : (
            sortedCategories.map((cat) => {
              const catMeta = CATEGORY_META[cat] || CATEGORY_META.blue_team
              const catMissions = grouped[cat]
              return (
                <div key={cat} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 px-1 py-2">
                    <catMeta.icon className={`h-3.5 w-3.5`} style={{ color: catMeta.palette.primary }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      {catMeta.label}
                    </span>
                    <span className="ml-auto text-[9px] text-zinc-700">{catMissions.length}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {catMissions.map((m, i) => {
                      const MissionIcon = getMissionIcon(m)
                      const diffMeta = getDifficultyMeta(m)
                      const palette = catMeta.palette
                      return (
                        <motion.button
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.05 }}
                          onClick={() => handleSelectMission(m)}
                          className="group relative flex items-start gap-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-950/70"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                              backgroundImage: `linear-gradient(135deg, transparent, transparent, ${palette.glow.replace("0.45", "0.04")})`,
                            }}
                          />
                          <Icon3D
                            icon={MissionIcon}
                            palette={palette}
                            size="h-9 w-9 shrink-0"
                            iconSize="h-4 w-4"
                          />
                          <div className="relative z-10 min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-sm font-bold tracking-wide text-zinc-200 group-hover:text-zinc-100 transition-colors">
                                  {m.title}
                                </span>
                                {m.badge && (
                                  <span className="ml-2 inline-block rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 align-middle">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-medium text-zinc-400">{m.subtitle}</span>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 group-hover:text-zinc-400 line-clamp-1 transition-colors">
                              {m.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              {m.duration && (
                                <span className="flex items-center gap-1 text-[9px] text-zinc-600">
                                  <Clock className="h-2.5 w-2.5" />
                                  {m.duration}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[9px] text-zinc-600">
                                <span className={`h-1.5 w-1.5 rounded-full ${diffMeta.dot}`} />
                                {diffMeta.label}
                              </span>
                              {m.tools && m.tools.length > 0 && (
                                <span className="flex items-center gap-1 text-[9px] text-zinc-600 truncate max-w-[180px]">
                                  <Wrench className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{m.tools.join(", ")}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ── DETAIL VIEW ───────────────────────────────────────
  function renderDetail() {
    if (!selectedMission) return null
    const m = selectedMission
    const MissionIcon = getMissionIcon(m)
    const catMeta = getCategoryMeta(m)
    const diffMeta = getDifficultyMeta(m)
    const mode = getModeFromCategory(m.category)

    return (
      <div className="w-full max-w-3xl font-mono">
        <button
          onClick={goToCatalog}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al catálogo
        </button>

        <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3">
          <div className="flex items-start gap-3">
            <Icon3D icon={MissionIcon} palette={catMeta.palette} active size="h-10 w-10" iconSize="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold tracking-wider text-zinc-200">{m.title}</h2>
                {m.badge && (
                  <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-zinc-400 mt-0.5">{m.subtitle}</p>
              <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">{m.description}</p>
            </div>
          </div>
        </div>

        <div className="border-x border-zinc-800 bg-zinc-950/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {m.duration && (
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <Clock className="h-3 w-3 text-zinc-600" />
                <span className="text-zinc-400">{m.duration}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className={`h-2 w-2 rounded-full ${diffMeta.dot}`} />
              <span className={diffMeta.color}>{diffMeta.label}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <catMeta.icon className="h-3 w-3" style={{ color: catMeta.palette.primary }} />
              <span style={{ color: catMeta.palette.primary }}>{catMeta.label}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Activity className="h-3 w-3 text-zinc-600" />
              <span className="text-zinc-400">Modo: {mode === "red_team" ? "Red Team" : "Blue Team"}</span>
            </span>
            {m.tools && m.tools.length > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <Wrench className="h-3 w-3 text-zinc-600" />
                <span className="text-zinc-400 truncate max-w-[200px]">{m.tools.join(", ")}</span>
              </span>
            )}
          </div>

          {m.lab && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-start gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-2.5">
                <FlaskConical className="h-3.5 w-3.5 text-cyan-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-zinc-500">
                  <span className="text-cyan-400 font-semibold">Lab:</span>{" "}
                  {m.lab.description}
                  {m.lab.image && (
                    <span className="ml-1 font-mono text-zinc-600">({m.lab.image})</span>
                  )}
                </div>
              </div>
              {m.lab.image && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 p-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200/80 leading-relaxed">
                    Requiere <span className="font-semibold text-amber-300">Docker Desktop</span> en ejecución
                    (ícono de ballena → Engine running). Si falla el deploy, ábrelo y reintenta.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Pasos ({m.steps?.length || 0})
          </p>
          <div className="space-y-1">
            {m.steps?.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-2.5 rounded-lg border border-zinc-800/40 bg-zinc-950/30 px-3 py-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/60 text-[9px] font-mono text-zinc-500">
                  {i + 1}
                </span>
                <span className="text-[11px] text-zinc-300">{s.name}</span>
                <span className="ml-auto text-[9px] font-mono text-zinc-600">{s.type}</span>
              </div>
            ))}
          </div>

          {(!m.steps || m.steps.length === 0) && (
            <p className="text-[11px] text-zinc-600">Esta misión no tiene pasos definidos.</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleStartMission}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" />
              Ejecutar misión
            </button>
            <span className="text-[9px] text-zinc-600">
              {m.lab?.image ? "Entorno Docker · " : ""}
              No requiere target
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── EXECUTION VIEW ────────────────────────────────────
  function renderExecution() {
    const doneCount = steps.filter((s) => s.status === "done").length
    const totalCount = steps.length

    return (
      <div className="w-full max-w-3xl font-mono">
        <button
          onClick={goToCatalog}
          disabled={running}
          className={`flex items-center gap-1.5 text-[11px] transition-colors mb-3 ${
            running
              ? "text-zinc-700 cursor-not-allowed"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al catálogo
        </button>

        <div className={`relative overflow-hidden rounded-t-lg border px-4 py-2 ${
          running
            ? "border-cyan-900/40 bg-gradient-to-r from-zinc-950 via-cyan-950/10 to-zinc-950"
            : runStatus === "success"
            ? "border-green-900/40 bg-gradient-to-r from-zinc-950 via-green-950/10 to-zinc-950"
            : runStatus === "failed"
            ? "border-red-900/40 bg-gradient-to-r from-zinc-950 via-red-950/10 to-zinc-950"
            : "border-zinc-800 bg-zinc-950/80"
        }`}>
          <AnimatedProgress done={doneCount} total={totalCount} active={running} />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={`font-semibold ${running ? "text-cyan-400" : runStatus === "success" ? "text-green-400" : "text-zinc-300"}`}>
              {running && <Activity className="inline h-3 w-3 mr-1 animate-pulse" />}
              {selectedMission?.title || "Misión"}
            </span>
            <span className="text-zinc-500">{running ? "EJECUTANDO" : runStatus === "success" ? "COMPLETADO" : "FINALIZADO"}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-zinc-600 mt-0.5">
            <span>
              ESTADO:{" "}
              <span className={
                running ? "text-cyan-400" : runStatus === "success" ? "text-green-400" : "text-red-400"
              }>
                {running ? "EN PROGRESO" : runStatus === "success" ? "FINALIZADO" : "FALLIDO"}
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
              <span>Iniciando misión...</span>
            </div>
          )}
          {steps.map((step, i) => (
            <MissionStepCard key={step.id} step={step} index={i} isLast={i === steps.length - 1} />
          ))}
        </div>

        {!running && reportUrls && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4"
          >
            <div className="rounded-t-lg border border-green-900/50 bg-gradient-to-r from-zinc-950 via-green-950/20 to-zinc-950 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                    <Zap className="h-3 w-3" />
                    REPORTE GENERADO
                  </span>
                  <h3 className="text-sm font-bold text-zinc-200 mt-0.5">{selectedMission?.title}</h3>
                </div>
                <Icon3D icon={FileText} palette={ICON_PALETTES.green} active size="h-10 w-10" iconSize="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-400">
                <Target className="h-3 w-3 text-cyan-400" />
                Run ID: <span className="font-mono text-cyan-300">{runId?.slice(0, 12) || "N/A"}</span>
              </div>
            </div>

            <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Descargar reporte
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${API_URL}${reportUrls.md}`}
                  download
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-all group"
                >
                  <FileText className="h-4 w-4 text-green-500 group-hover:text-green-400" />
                  <div>
                    <span className="font-semibold">Reporte MD</span>
                    <span className="block text-[9px] text-zinc-600">Markdown con evidencias</span>
                  </div>
                  <Download className="h-3.5 w-3.5 ml-auto text-zinc-600 group-hover:text-zinc-400" />
                </a>
                <a
                  href={`${API_URL}${reportUrls.pdf}`}
                  download
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-all group"
                >
                  <FilePdf className="h-4 w-4 text-red-500 group-hover:text-red-400" />
                  <div>
                    <span className="font-semibold">Reporte PDF</span>
                    <span className="block text-[9px] text-zinc-600">Documento formal</span>
                  </div>
                  <Download className="h-3.5 w-3.5 ml-auto text-zinc-600 group-hover:text-zinc-400" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {!running && !reportUrls && steps.length > 0 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={goToCatalog}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Volver al catálogo
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl">
      {view === "catalog" && renderCatalog()}
      {view === "detail" && renderDetail()}
      {view === "execution" && renderExecution()}
    </div>
  )
}
