import { useEffect, useRef, useState } from "react"
import { Terminal } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { io } from "socket.io-client"
import "xterm/css/xterm.css"

const TERMINAL_SERVER_URL = process.env.NEXT_PUBLIC_TERMINAL_SERVER_URL || "http://localhost:4000"

// Tema de xterm calcado del aesthetic de MissionConsole (zinc-950/black + verde/cian)
const ARES_TERMINAL_THEME = {
  background: "#00000000", // transparente: el contenedor ya trae bg-black/60
  foreground: "#86efac", // green-300
  cursor: "#4ade80", // green-400
  cursorAccent: "#000000",
  selectionBackground: "#22d3ee55", // cyan-400 @ ~33%
  black: "#09090b",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e4e4e7",
  brightBlack: "#52525b",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde047",
  brightBlue: "#93c5fd",
  brightMagenta: "#d8b4fe",
  brightCyan: "#67e8f9",
  brightWhite: "#fafafa",
}

/**
 * TerminalConsole
 * ---------------------------------------------------------------------------
 * Terminal Linux real conectada al microservicio ares-terminal-server
 * (node-pty + socket.io). No depende del backend FastAPI del chat: es una
 * conexión Socket.IO independiente.
 *
 * Props:
 *   - containerId?: string   ID/nombre de contenedor Docker (Vulhub) al que
 *                            adjuntarse. Si se omite, abre un shell local.
 *   - label?: string         Texto del header (default: "TERMINAL: Sesión local")
 *   - targetIp?: string      IP mostrada en el header, igual que MissionConsole
 */
export default function TerminalConsole({ containerId, label, targetIp }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  const socketRef = useRef(null)
  const [status, setStatus] = useState("connecting") // connecting | ready | error | exited
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      theme: ARES_TERMINAL_THEME,
      allowProposedApi: true,
      scrollback: 5000,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    const socket = io(TERMINAL_SERVER_URL, {
      query: {
        containerId: containerId || "",
        cols: term.cols,
        rows: term.rows,
      },
      transports: ["websocket"],
    })
    socketRef.current = socket

    socket.on("connect", () => {
      setStatus("connecting")
    })

    socket.on("terminal:ready", ({ mode, target }) => {
      setStatus("ready")
      setStatusMessage(mode === "docker" ? `Conectado a contenedor: ${target}` : "Shell local activo")
      term.focus()
    })

    socket.on("terminal:output", ({ data }) => {
      term.write(data)
    })

    socket.on("terminal:error", ({ message }) => {
      setStatus("error")
      setStatusMessage(message)
      term.write(`\r\n\x1b[31m[ARES-TERM ERROR]\x1b[0m ${message}\r\n`)
    })

    socket.on("terminal:exit", ({ code }) => {
      setStatus("exited")
      setStatusMessage(`Sesión finalizada (código ${code})`)
      term.write(`\r\n\x1b[33m[ARES-TERM]\x1b[0m Sesión finalizada (código ${code}).\r\n`)
    })

    socket.on("connect_error", () => {
      setStatus("error")
      setStatusMessage("No se pudo conectar con el terminal-server. ¿Está corriendo en :4000?")
    })

    const onData = term.onData((data) => {
      socket.emit("terminal:input", { data })
    })

    const handleResize = () => {
      fitAddon.fit()
      socket.emit("terminal:resize", { cols: term.cols, rows: term.rows })
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      onData.dispose()
      resizeObserver.disconnect()
      socket.disconnect()
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId])

  const statusColor =
    status === "ready" ? "text-green-400" : status === "error" ? "text-red-400" : status === "exited" ? "text-yellow-400" : "text-zinc-500"

  return (
    <div className="w-full max-w-3xl font-mono">
      <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-400 font-semibold">
            {label || (containerId ? `TERMINAL: ${containerId}` : "TERMINAL: Sesión local")}
          </span>
          {targetIp && <span className="text-zinc-500">IP: {targetIp}</span>}
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <span>
            ESTADO: <span className={statusColor}>{status.toUpperCase()}</span>
          </span>
          {statusMessage && <span className="truncate">{statusMessage}</span>}
        </div>
      </div>

      <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60 p-2 h-[420px]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
