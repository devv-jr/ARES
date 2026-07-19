"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Terminal,
  Search,
  Trash2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Info,
  XCircle,
  MessageSquare,
  Play,
  Container,
  ShieldAlert,
  Cpu,
  Activity,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const LEVEL_ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
}

const LEVEL_COLORS = {
  info: "text-blue-400 border-blue-800/40 bg-blue-950/20",
  warn: "text-amber-400 border-amber-800/40 bg-amber-950/20",
  error: "text-red-400 border-red-800/40 bg-red-950/20",
}

const LEVEL_BADGES = {
  info: "bg-blue-900/40 text-blue-300",
  warn: "bg-amber-900/40 text-amber-300",
  error: "bg-red-900/40 text-red-300",
}

const TYPE_ICONS = {
  chat_query: MessageSquare,
  chat_response: MessageSquare,
  guardrail_triggered: ShieldAlert,
  rate_limit: AlertTriangle,
  llm_error: XCircle,
  playbook_start: Play,
  playbook_step: Activity,
  playbook_end: Play,
  playbook_error: XCircle,
  docker_start: Container,
  docker_stop: Container,
  pipeline_start: Terminal,
  pipeline_error: XCircle,
  system: Cpu,
}

const TYPE_LABELS = {
  chat_query: "Chat Query",
  chat_response: "Chat Response",
  guardrail_triggered: "Guardrail",
  rate_limit: "Rate Limit",
  llm_error: "LLM Error",
  playbook_start: "Playbook Start",
  playbook_step: "Playbook Step",
  playbook_end: "Playbook End",
  playbook_error: "Playbook Error",
  docker_start: "Docker Start",
  docker_stop: "Docker Stop",
  pipeline_start: "Pipeline",
  pipeline_error: "Pipeline Error",
  system: "System",
}

function formatTimestamp(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return iso
  }
}

function LogRow({ entry }) {
  const LevelIcon = LEVEL_ICONS[entry.level] || Info
  const TypeIcon = TYPE_ICONS[entry.type] || Terminal
  const levelColor = LEVEL_COLORS[entry.level] || LEVEL_COLORS.info
  const badgeColor = LEVEL_BADGES[entry.level] || LEVEL_BADGES.info

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-xs transition-colors hover:brightness-110 ${levelColor}`}
    >
      <div className="mt-0.5 flex shrink-0 flex-col items-center gap-1">
        <LevelIcon className="h-3.5 w-3.5" />
        <span className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none ${badgeColor}`}>
          {entry.level}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-500">
            {formatTimestamp(entry.timestamp)}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
            <TypeIcon className="h-3 w-3" />
            {TYPE_LABELS[entry.type] || entry.type}
          </span>
          <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500">
            {entry.module}
          </span>
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-zinc-200">
          {entry.message}
        </p>
        {entry.details && Object.keys(entry.details).length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-[9px] font-semibold uppercase tracking-wider text-zinc-600 hover:text-zinc-400">
              Detalles
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2 text-[9px] text-zinc-500">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default function EvidenciasPanel() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ total: 0, by_level: {}, by_type: {} })
  const [levelFilter, setLevelFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [isPolling, setIsPolling] = useState(true)
  const [clearing, setClearing] = useState(false)
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" })
      if (levelFilter !== "all") params.set("level", levelFilter)
      const res = await fetch(`${API_URL}/audit/logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.entries || [])
      }
      const statsRes = await fetch(`${API_URL}/audit/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch {
      /* backend no disponible */
    }
  }, [levelFilter])

  useEffect(() => {
    fetchLogs()
    if (!isPolling) return
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [fetchLogs, isPolling])

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, autoScroll])

  async function handleClear() {
    setClearing(true)
    try {
      await fetch(`${API_URL}/audit/clear`, { method: "POST" })
      setLogs([])
      setStats({ total: 0, by_level: {}, by_type: {} })
    } catch {
      /* ignore */
    }
    setClearing(false)
  }

  const filteredLogs = search
    ? logs.filter(
        (e) =>
          e.message.toLowerCase().includes(search.toLowerCase()) ||
          e.type.toLowerCase().includes(search.toLowerCase()) ||
          e.module.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const LEVELS = ["all", "info", "warn", "error"]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-8 font-mono"
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Evidencias — Audit Log
            </span>
            <span className="rounded bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400">
              {stats.total} registros
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPolling((p) => !p)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                isPolling
                  ? "border-green-800/40 bg-green-950/30 text-green-400"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${isPolling ? "animate-spin" : ""}`} />
              {isPolling ? "Live" : "Pausado"}
            </button>

            <button
              onClick={handleClear}
              disabled={clearing || logs.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:border-red-800/60 hover:text-red-400 disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Limpiar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800/60 px-4 py-2.5">
          <div className="flex items-center gap-1 rounded-lg bg-zinc-900/60 p-0.5">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  levelFilter === lvl
                    ? "bg-red-900/40 text-red-300"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {lvl === "all" ? "Todos" : lvl}
                {lvl !== "all" && stats.by_level[lvl] != null && (
                  <span className="ml-1 text-zinc-600">({stats.by_level[lvl]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en logs..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-1.5 pl-7 pr-2 text-[11px] text-zinc-300 placeholder-zinc-600 transition-colors focus:border-red-800/50 focus:outline-hidden"
            />
          </div>

          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-3 w-3 rounded border-zinc-700 bg-zinc-800 accent-red-600"
            />
            Auto-scroll
          </label>
        </div>

        <div
          ref={containerRef}
          className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto p-3"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-600">
              <Terminal className="h-8 w-8" />
              <p className="text-xs">
                {search || levelFilter !== "all"
                  ? "No hay registros que coincidan con los filtros."
                  : "No hay registros de auditor\u00eda. Comienza a usar ARES para generar evidencia."}
              </p>
            </div>
          ) : (
            filteredLogs.map((entry) => <LogRow key={entry.id} entry={entry} />)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800/60 px-4 py-2">
          <span className="text-[10px] text-zinc-600">
            Mostrando {filteredLogs.length} de {logs.length} registros
            {search && ` (filtrados: "${search}")`}
          </span>
          <span className="text-[9px] text-zinc-700">
            ARES Audit System v1.0
          </span>
        </div>
      </div>
    </motion.div>
  )
}
