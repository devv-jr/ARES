import { Shield, Paperclip, SlidersHorizontal, Mic, Loader2, ArrowUp } from "lucide-react"

export default function InputArea({ value, onChange, onSend, loading }) {
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
            aria-disabled={loading || !value.trim()}
            data-disabled={loading || !value.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-red-600 to-purple-800 text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-90 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
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
