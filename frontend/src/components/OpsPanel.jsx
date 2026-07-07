import { useState } from "react"
import MissionConsole from "./MissionConsole"
import TerminalConsole from "./TerminalConsole"

/**
 * OpsPanel
 * ---------------------------------------------------------------------------
 * Envoltorio con tabs para alternar entre el chat de ARES (MissionConsole,
 * sin modificar) y la terminal real (TerminalConsole). Pensado para
 * reemplazar el punto donde hoy renderizas <MissionConsole /> directamente
 * en page.jsx, sin tocar la lógica interna de ninguno de los dos.
 *
 * Props:
 *   - chatProps: props que hoy le pasas a MissionConsole (messages, input, etc.)
 *   - containerId?: string  ID del contenedor Vulhub activo (si aplica)
 *   - targetIp?: string     IP mostrada en ambos headers
 */
export default function OpsPanel({ chatProps, containerId, targetIp }) {
  const [tab, setTab] = useState("chat") // "chat" | "terminal"

  return (
    <div className="w-full max-w-3xl">
      <div className="flex gap-1 mb-2 font-mono text-xs">
        <TabButton active={tab === "chat"} onClick={() => setTab("chat")}>
          CHAT
        </TabButton>
        <TabButton active={tab === "terminal"} onClick={() => setTab("terminal")}>
          TERMINAL
        </TabButton>
      </div>

      {tab === "chat" ? (
        <MissionConsole {...chatProps} />
      ) : (
        <TerminalConsole containerId={containerId} targetIp={targetIp} />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-t-md border border-b-0 border-zinc-800 transition-colors ${
        active ? "bg-zinc-950/80 text-green-400" : "bg-transparent text-zinc-600 hover:text-zinc-400"
      }`}
    >
      {children}
    </button>
  )
}
