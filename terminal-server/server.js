/**
 * ARES Terminal Server
 * ---------------------------------------------------------------------------
 * Microservicio independiente (Node.js) que expone una terminal Linux real
 * en tiempo real vía Socket.IO, respaldada por node-pty.
 *
 * Por qué está separado de FastAPI:
 *   node-pty es un módulo nativo de Node — no puede correr dentro del
 *   backend Python de ARES. Este servicio vive en su propio puerto y el
 *   frontend Next.js se conecta a él directamente con socket.io-client.
 *
 * Modos de sesión:
 *   - Shell local: pty.spawn(DEFAULT_SHELL) → terminal Linux normal.
 *   - Shell en contenedor: si el cliente manda `containerId`, se hace
 *     `docker exec -it <containerId> bash` para operar DENTRO de un
 *     entorno Vulhub aislado (backdoors, SQLi, etc. de forma controlada).
 *
 * Eventos Socket.IO:
 *   Cliente -> Servidor:
 *     - "terminal:input"  { data: string }
 *     - "terminal:resize" { cols: number, rows: number }
 *   Servidor -> Cliente:
 *     - "terminal:output" { data: string }
 *     - "terminal:ready"  { mode: "local" | "docker", target?: string }
 *     - "terminal:exit"   { code: number, signal: number }
 *     - "terminal:error"  { message: string }
 */

const path = require("path");
const os = require("os");
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const PORT = parseInt(process.env.TERMINAL_PORT || "4000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const DEFAULT_SHELL = process.env.DEFAULT_SHELL || (os.platform() === "win32" ? "powershell.exe" : "/bin/bash");
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || "5", 10);
const IDLE_TIMEOUT_MS = parseInt(process.env.IDLE_TIMEOUT_MS || "900000", 10);

const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Registro simple en memoria de sesiones activas (por socket.id)
const sessions = new Map();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", activeSessions: sessions.size, maxSessions: MAX_SESSIONS });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

/**
 * Whitelist mínima de contenedores permitidos. En este MVP se acepta
 * cualquier containerId que el backend FastAPI (docker_manager.py) haya
 * devuelto como "vivo" tras levantar un escenario Vulhub. Si más adelante
 * quieres cerrarlo más, pásale aquí una función que valide contra Docker
 * (docker inspect) antes de adjuntarse.
 */
function buildPtyCommand({ containerId }) {
  if (containerId && typeof containerId === "string" && containerId.trim()) {
    return {
      mode: "docker",
      target: containerId,
      file: "docker",
      args: ["exec", "-it", containerId.trim(), "bash"],
    };
  }
  return {
    mode: "local",
    file: DEFAULT_SHELL,
    args: [],
  };
}

io.on("connection", (socket) => {
  if (sessions.size >= MAX_SESSIONS) {
    socket.emit("terminal:error", { message: "Límite de sesiones de terminal alcanzado. Intenta más tarde." });
    socket.disconnect(true);
    return;
  }

  const { containerId, cols, rows } = socket.handshake.query;
  const command = buildPtyCommand({ containerId });

  let ptyProcess;
  try {
    ptyProcess = pty.spawn(command.file, command.args, {
      name: "xterm-256color",
      cols: parseInt(cols, 10) || 80,
      rows: parseInt(rows, 10) || 24,
      cwd: process.env.HOME || process.cwd(),
      env: process.env,
    });
  } catch (err) {
    socket.emit("terminal:error", { message: `No se pudo iniciar la terminal: ${err.message}` });
    socket.disconnect(true);
    return;
  }

  let idleTimer = null;
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      socket.emit("terminal:error", { message: "Sesión cerrada por inactividad." });
      cleanup();
    }, IDLE_TIMEOUT_MS);
  };

  sessions.set(socket.id, { ptyProcess, mode: command.mode, target: command.target });
  resetIdleTimer();

  socket.emit("terminal:ready", { mode: command.mode, target: command.target });

  ptyProcess.onData((data) => {
    socket.emit("terminal:output", { data });
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    socket.emit("terminal:exit", { code: exitCode, signal });
    cleanup();
  });

  socket.on("terminal:input", ({ data }) => {
    resetIdleTimer();
    if (typeof data === "string") {
      ptyProcess.write(data);
    }
  });

  socket.on("terminal:resize", ({ cols: newCols, rows: newRows }) => {
    if (Number.isFinite(newCols) && Number.isFinite(newRows) && newCols > 0 && newRows > 0) {
      try {
        ptyProcess.resize(newCols, newRows);
      } catch (_err) {
        // El pty puede haber muerto ya; ignoramos resize fallido.
      }
    }
  });

  socket.on("disconnect", () => {
    cleanup();
  });

  function cleanup() {
    if (idleTimer) clearTimeout(idleTimer);
    const session = sessions.get(socket.id);
    if (session) {
      try {
        session.ptyProcess.kill();
      } catch (_err) {
        // proceso ya podría estar muerto
      }
      sessions.delete(socket.id);
    }
    if (socket.connected) socket.disconnect(true);
  }
});

httpServer.listen(PORT, () => {
  console.log(`[ares-terminal] escuchando en :${PORT} (frontend permitido: ${FRONTEND_URL})`);
  console.log(`[ares-terminal] shell local por defecto: ${DEFAULT_SHELL}`);
});
