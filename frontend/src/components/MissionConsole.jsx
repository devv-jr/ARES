import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowUp, Loader2 } from "lucide-react"

export default function MissionConsole({ messages, input, setInput, handleSend, loading, error }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-3xl font-mono">
      <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-400 font-semibold">LABORATORIO: Apache Backdoor</span>
          <span className="text-zinc-500">IP: 172.20.0.4</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <span>OBJETIVO: Reconocimiento</span>
          <span>HERRAMIENTA: Nmap</span>
        </div>
      </div>

      <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-4 min-h-[320px] max-h-[420px] overflow-y-auto">
        {messages.length === 0 && !loading && (
          <p className="text-zinc-600 text-sm">
            <span className="text-zinc-500">[SISTEMA]</span> ARES listo. Ingresa un comando.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="text-sm leading-relaxed py-0.5">
            <span className={m.role === "assistant" ? "text-green-400" : "text-cyan-400"}>
              {m.role === "assistant" ? "[ARES]" : "[OPERADOR]"}
            </span>
            <span className="text-zinc-300 whitespace-pre-wrap break-words">&nbsp;{m.role === "assistant" ? m.content : m.content}</span>
          </div>
        ))}
        {error && (
          <div className="text-red-400 text-sm mt-1">
            <span className="text-red-500">[ERROR]</span> {error}
          </div>
        )}
        {loading && (
          <span className="text-green-400 text-sm inline-flex items-center gap-1 mt-1">
            <span className="text-zinc-500">[ARES]</span>
            <motion.span
              className="inline-block h-4 w-1.5 bg-green-400"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </span>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
        <span className="text-green-400 text-sm font-mono shrink-0">ARES&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ingresa un comando..."
          className="flex-1 bg-transparent text-sm text-zinc-200 font-mono outline-none placeholder:text-zinc-600 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-green-700/60 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
