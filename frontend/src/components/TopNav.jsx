import { ChevronDown, Settings2, Download } from "lucide-react"
import { MODE_OPTIONS, MODE_LABELS } from "../lib/constants"

export default function TopNav({ selectedMode, onModeChange, modeMenuOpen, setModeMenuOpen }) {
  const currentLabel = MODE_LABELS[selectedMode] || "Learning"

  return (
    <header className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => setModeMenuOpen((previous) => !previous)}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 backdrop-blur-md transition-colors hover:border-zinc-700"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]" />
          <span className="font-medium">ARES v4.0</span>
          <span className="text-zinc-500">— {currentLabel}</span>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </button>

        {modeMenuOpen && (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/95 p-1 shadow-2xl shadow-black/40 backdrop-blur-md">
            {MODE_OPTIONS.map((option) => {
              const isActive = option.value === selectedMode

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onModeChange(option.value)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-red-950/50 text-zinc-100"
                      : "text-zinc-300 hover:bg-zinc-900/80 hover:text-zinc-100"
                  }`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      isActive ? "bg-red-500" : "bg-zinc-600"
                    }`}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-zinc-500">{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

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
