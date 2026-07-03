"use client"

import { useEffect, useRef, useState } from "react"
import {
  Shield,
  Plus,
  MessageSquare,
  FolderArchive,
  ScrollText,
  Radar,
  Network,
  Bug,
  Settings2,
  Download,
  ChevronDown,
  Paperclip,
  SlidersHorizontal,
  ArrowUp,
  Mic,
  ShieldAlert,
  FileSearch,
  ShieldCheck,
  Zap,
  ScanLine,
  FileCode2,
  LifeBuoy,
  Sparkles,
  Loader2,
  TriangleAlert,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function SidebarNavItem({ icon: Icon, label, active }) {
  return (
    <button
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-zinc-800/60 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
      {children}
    </p>
  )
}

function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      {/* Cabecera */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-purple-800 shadow-lg shadow-red-900/40">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-wide text-zinc-100">ARES</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Security AI
          </p>
        </div>
      </div>

      {/* Botón principal */}
      <div className="px-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-purple-800 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />
          Nueva Sesión
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3">
        <SectionLabel>Características</SectionLabel>
        <div className="flex flex-col gap-0.5">
          <SidebarNavItem icon={MessageSquare} label="Chat" active />
          <SidebarNavItem icon={FolderArchive} label="Archivos" />
          <SidebarNavItem icon={ScrollText} label="Biblioteca de Scripts" />
        </div>

        <SectionLabel>Entornos</SectionLabel>
        <div className="flex flex-col gap-0.5">
          <SidebarNavItem icon={Radar} label="Nuevo Escaneo" />
          <SidebarNavItem icon={Network} label="Análisis de Red" />
          <SidebarNavItem icon={Bug} label="Reverse Engineering" />
        </div>
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-zinc-100">
              Actualizar a ARES Pro
            </p>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            Automatización ofensiva y defensiva sin límites, con agentes que se
            adaptan a tu perímetro.
          </p>
          <button className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-red-800/60 hover:bg-zinc-800">
            Actualizar
          </button>
        </div>
      </div>
    </aside>
  )
}

function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
      <button className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 backdrop-blur-md transition-colors hover:border-zinc-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]" />
        <span className="font-medium">ARES v4.0</span>
        <span className="text-zinc-500">— Stealth Mode</span>
        <ChevronDown className="h-4 w-4 text-zinc-500" />
      </button>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-300 backdrop-blur-md transition-colors hover:border-zinc-700">
          <Settings2 className="h-3.5 w-3.5" />
          Configuración
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-300 backdrop-blur-md transition-colors hover:border-zinc-700">
          <Download className="h-3.5 w-3.5" />
          Exportar Log
        </button>
      </div>
    </header>
  )
}

function AiCore() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {/* Anillo táctico giratorio */}
      <div className="ares-core-ring absolute inset-0 rounded-full border border-dashed border-red-800/40" />
      <div className="ares-core-ring absolute inset-3 rounded-full border border-purple-800/30" />
      {/* Núcleo */}
      <div className="ares-core h-20 w-20 rounded-full bg-gradient-to-br from-red-500 via-red-700 to-purple-900" />
      {/* Brillo interno */}
      <div className="pointer-events-none absolute left-1/2 top-8 h-4 w-4 -translate-x-1/2 rounded-full bg-white/50 blur-md" />
    </div>
  )
}

function SuggestionChip({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md transition-colors hover:border-red-900/50 hover:text-zinc-100"
    >
      <Icon className="h-3.5 w-3.5 text-red-500" />
      {label}
    </button>
  )
}

function InputArea({ value, onChange, onSend, loading }) {
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 backdrop-blur-md">
      <div className="flex items-start gap-2 px-2 pt-1">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Introduce un comando o script..."
          className="w-full bg-transparent py-1 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-zinc-800/80 pt-2">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200">
            <Paperclip className="h-3.5 w-3.5" />
            Adjuntar log
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Ajustes
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200">
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={onSend}
            disabled={loading || !value.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-purple-800 text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ role, content }) {
  const isUser = role === "user"
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl border px-4 py-2.5 text-sm leading-relaxed backdrop-blur-md ${
          isUser
            ? "border-red-900/40 bg-gradient-to-br from-red-950/60 to-purple-950/40 text-zinc-100"
            : "border-zinc-800 bg-zinc-900/50 text-zinc-300"
        }`}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-500">
            <Shield className="h-3 w-3" />
            ARES
          </div>
        )}
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

function ChatLog({ messages, error }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, error])

  if (messages.length === 0 && !error) return null

  return (
    <div className="mb-4 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4 backdrop-blur-md">
      {messages.map((m, i) => (
        <ChatMessage key={i} role={m.role} content={m.content} />
      ))}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function FeatureCard({ icon: Icon, tag, title, description }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md transition-colors hover:border-red-900/50">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60">
          <Icon className="h-4 w-4 text-red-500" />
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {tag}
        </span>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
    </div>
  )
}

export default function AresDashboard() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        throw new Error(`El servidor respondió con estado ${res.status}`)
      }

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "No se pudo conectar con el backend de ARES. Verifica que esté corriendo."
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestion(label) {
    setInput(label)
  }

  const features = [
    {
      icon: ShieldAlert,
      tag: "Threat Intel",
      title: "Inteligencia de Amenazas",
      description:
        "Correlaciona IoCs en tiempo real y prioriza alertas críticas del perímetro.",
    },
    {
      icon: FileSearch,
      tag: "Malware",
      title: "Análisis de Malware",
      description:
        "Desensambla binarios sospechosos y genera un informe de comportamiento.",
    },
    {
      icon: ShieldCheck,
      tag: "SecDev",
      title: "Asistente de Desarrollo Seguro",
      description:
        "Audita tu código en busca de vulnerabilidades y sugiere correcciones.",
    },
  ]

  return (
    <div className="dark flex h-screen w-full overflow-hidden bg-black text-zinc-100">
      <Sidebar />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Resplandor ambiental */}
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-red-900/20 blur-[120px]" />

        <div className="relative z-10 flex h-full flex-col">
          <TopNav />

          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
            {/* Hero */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <AiCore />
              <h1 className="text-balance text-center text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                ¿Listo para asegurar el perímetro?
              </h1>

              {/* Sugerencias rápidas */}
              {messages.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <SuggestionChip
                    icon={ScanLine}
                    label="Escanear vulnerabilidades"
                    onClick={() => handleSuggestion("Escanear vulnerabilidades")}
                  />
                  <SuggestionChip
                    icon={FileCode2}
                    label="Auditar código"
                    onClick={() => handleSuggestion("Auditar código")}
                  />
                  <SuggestionChip
                    icon={LifeBuoy}
                    label="Plan de contingencia"
                    onClick={() => handleSuggestion("Plan de contingencia")}
                  />
                </div>
              )}

              {/* Historial de chat */}
              <ChatLog messages={messages} error={error} />

              {/* Input */}
              <InputArea value={input} onChange={setInput} onSend={handleSend} loading={loading} />
            </div>

            {/* Tarjetas de funciones */}
            <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
              {features.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
