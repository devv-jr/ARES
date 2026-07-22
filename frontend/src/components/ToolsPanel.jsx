"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wrench, Unlock, Hash, Terminal, Monitor,
  Search, X, Copy, Check, ChevronDown,
  ChevronRight, ArrowLeft, Clock, FileText,
  Loader2, FileCode, BookOpen,
} from "lucide-react"
import {
  decodeValue,
  generateHashes,
  searchLinux,
  searchWindows,
  getLinuxEntry,
  getWindowsEntry,
} from "../lib/tools"

const TOOL_TABS = [
  { id: "decoder", label: "Decoder", icon: Unlock, desc: "Base64 · Hex · URL" },
  { id: "hash", label: "Hash Generator", icon: Hash, desc: "MD5 · SHA1 · SHA256" },
  { id: "linux", label: "Linux Cheat Sheet", icon: Terminal, desc: "Comandos y explicación" },
  { id: "windows", label: "Windows Commands", icon: Monitor, desc: "CMD · PowerShell" },
]

const ENCODINGS = [
  { value: "auto", label: "Auto" },
  { value: "base64", label: "Base64" },
  { value: "hex", label: "Hex" },
  { value: "url", label: "URL" },
]

const HASH_ALGOS = [
  { id: "md5", label: "MD5" },
  { id: "sha1", label: "SHA1" },
  { id: "sha256", label: "SHA256", default: true },
  { id: "sha512", label: "SHA512" },
]

const CATEGORY_LABELS = {
  services: "Servicios",
  network: "Red",
  logs: "Logs",
  permissions: "Permisos",
  firewall: "Firewall",
  process: "Procesos",
  identity: "Identidad",
  storage: "Almacenamiento",
  system: "Sistema",
}

function TabButton({ tab, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-zinc-800/60 text-zinc-100 shadow-sm"
          : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300"
      }`}
    >
      <tab.icon className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[9px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-colors shrink-0"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copiado" : "Copiar"}
    </button>
  )
}

function ResultCard({ label, value, mono }) {
  if (value == null) return null
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/30 p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">{label}</p>
      <div className="flex items-start gap-2">
        <p className={`flex-1 text-[11px] leading-relaxed break-all ${mono ? "font-mono text-green-400/90" : "text-zinc-300"}`}>
          {value}
        </p>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

function InputPanel({ id, placeholder, value, onChange, onSend, loading, rows }) {
  return (
    <div className="flex gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows || 2}
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[12px] font-mono text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700 resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onSend()
          }
        }}
      />
      <button
        onClick={onSend}
        disabled={loading || !value?.trim()}
        className="flex items-center gap-1.5 self-end rounded-lg bg-gradient-to-r from-red-600 to-purple-700 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg shadow-purple-900/20 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileCode className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{loading ? "Procesando..." : "Ejecutar"}</span>
      </button>
    </div>
  )
}

// ── DECODER ─────────────────────────────────────────────────────────────

function DecoderTab() {
  const [input, setInput] = useState("")
  const [encoding, setEncoding] = useState("auto")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDecode() {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await decodeValue(input.trim(), encoding)
      if (res.ok) {
        setResult(res)
      } else {
        setError(res.error || "No se pudo decodificar")
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {ENCODINGS.map((enc) => (
          <button
            key={enc.value}
            onClick={() => setEncoding(enc.value)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              encoding === enc.value
                ? "bg-red-900/40 text-red-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {enc.label}
          </button>
        ))}
      </div>

      <InputPanel
        id="decode"
        placeholder="Pega un valor codificado (Base64, Hex, URL)..."
        value={input}
        onChange={setInput}
        onSend={handleDecode}
        loading={loading}
        rows={2}
      />

      {error && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 font-mono">{result.encoding}</span>
            <span>{result.bytes_length} bytes</span>
            {result.output_encoding && (
              <span className="text-zinc-600">{result.output_encoding}</span>
            )}
          </div>
          <ResultCard label="Salida decodificada" value={result.output} />
          <ResultCard label="Hex dump" value={result.raw_hex} mono />

          {result.chain && result.chain.length > 1 && (
            <div className="rounded-lg border border-zinc-800/40 bg-zinc-950/20 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">Cadena de decodificación</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {result.chain.map((c, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">{c.encoding}</span>
                    {i < result.chain.length - 1 && (
                      <span className="text-zinc-700 text-[9px]">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ── HASH GENERATOR ──────────────────────────────────────────────────────

function HashTab() {
  const [input, setInput] = useState("")
  const [selected, setSelected] = useState(["md5", "sha1", "sha256"])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function toggleAlgo(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  async function handleGenerate() {
    if (!input.trim() || selected.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await generateHashes(input.trim(), selected)
      if (res.ok) {
        setResult(res)
      } else {
        setError(res.error || "Error generando hashes")
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {HASH_ALGOS.map((algo) => (
          <button
            key={algo.id}
            onClick={() => toggleAlgo(algo.id)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              selected.includes(algo.id)
                ? "bg-purple-900/40 text-purple-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {algo.label}
          </button>
        ))}
      </div>

      <InputPanel
        id="hash"
        placeholder="Texto plano para hashear..."
        value={input}
        onChange={setInput}
        onSend={handleGenerate}
        loading={loading}
        rows={1}
      />

      {error && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            {result.input_bytes != null && (
              <span>{result.input_bytes} bytes</span>
            )}
          </div>
          {Object.entries(result.hashes).map(([algo, hashVal]) => (
            <ResultCard key={algo} label={algo.toUpperCase()} value={hashVal} mono />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── CHEATSHEET (Linux / Windows) ────────────────────────────────────────

function CheatsheetTab({ os }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isLinux = os === "linux"
  const search = isLinux ? searchLinux : searchWindows
  const getEntry = isLinux ? getLinuxEntry : getWindowsEntry

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await search(query.trim())
      setResults(res)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleSelect(id) {
    setLoading(true)
    try {
      const res = await getEntry(id)
      if (res.ok) {
        setSelectedEntry(res.entry)
      } else {
        setError(res.error || "No encontrado")
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  function handleBack() {
    setSelectedEntry(null)
  }

  // Detail view
  if (selectedEntry) {
    const e = selectedEntry
    return (
      <div className="space-y-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a resultados
        </button>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">{e.command}</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">{e.title}</p>
            </div>
            <CopyButton text={e.command} />
          </div>

          {e.category && (
            <span className="mt-2 inline-block rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
              {CATEGORY_LABELS[e.category] || e.category}
            </span>
          )}

          <div className="mt-3 rounded-lg border border-zinc-800/40 bg-zinc-900/40 p-2.5">
            <p className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">{e.explanation}</p>
          </div>

          {e.examples && e.examples.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">Ejemplos</p>
              <div className="space-y-1">
                {e.examples.map((ex, i) => (
                  <div key={i} className="group flex items-center gap-2 rounded border border-zinc-800/40 bg-black/50 px-2.5 py-1.5">
                    <span className="text-[10px] font-mono text-green-400/90 flex-1 break-all">{ex}</span>
                    <CopyButton text={ex} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {e.tags && e.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {e.tags.map((t) => (
                <span key={t} className="rounded bg-zinc-800/40 px-1.5 py-0.5 text-[8px] font-mono text-zinc-600">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Search view
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
            placeholder={isLinux ? "Buscar comando Linux... ej: systemctl" : "Buscar comando Windows... ej: ipconfig"}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pl-8 pr-3 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-purple-700 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg shadow-purple-900/20 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          {results.total === 0 ? (
            <p className="text-[11px] text-zinc-600 text-center py-6">
              No se encontraron comandos para "{results.query}"
            </p>
          ) : (
            <>
              <p className="text-[10px] text-zinc-600 mb-2">{results.total} resultado{results.total !== 1 ? "s" : ""}</p>
              {results.entries.map((entry, i) => (
                <motion.button
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelect(entry.id)}
                  className="w-full flex items-start gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-2.5 text-left transition-all hover:border-zinc-700 hover:bg-zinc-950/70 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                        {entry.command}
                      </span>
                      {entry.category && (
                        <span className="rounded bg-zinc-800/50 px-1 py-0.5 text-[8px] font-mono text-zinc-500">
                          {CATEGORY_LABELS[entry.category] || entry.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{entry.summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-zinc-600">{entry.title}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-700 shrink-0 mt-1 group-hover:text-zinc-500 transition-colors" />
                </motion.button>
              ))}
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ── MAIN PANEL ──────────────────────────────────────────────────────────

export default function ToolsPanel() {
  const [activeTab, setActiveTab] = useState("decoder")

  const activeMeta = TOOL_TABS.find((t) => t.id === activeTab)

  function renderTabContent() {
    switch (activeTab) {
      case "decoder":
        return <DecoderTab />
      case "hash":
        return <HashTab />
      case "linux":
        return <CheatsheetTab os="linux" />
      case "windows":
        return <CheatsheetTab os="windows" />
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-8 font-mono"
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <Wrench className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Herramientas
            </span>
          </div>
          <span className="text-[10px] text-zinc-600">{activeMeta?.desc}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800/60 px-4 py-2.5">
          {TOOL_TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <div className="min-h-[240px] p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800/60 px-4 py-2">
          <span className="text-[10px] text-zinc-600">
            {activeTab === "decoder" && "Base64 · Hex · URL — auto-detect disponible"}
            {activeTab === "hash" && "MD5 · SHA1 · SHA256 · SHA512 — criptografía unidireccional"}
            {activeTab === "linux" && "Busca comandos Linux con explicación ARES"}
            {activeTab === "windows" && "CMD y PowerShell con ejemplos prácticos"}
          </span>
          <span className="text-[9px] text-zinc-700">
            ARES Tools v1.0
          </span>
        </div>
      </div>
    </motion.div>
  )
}
