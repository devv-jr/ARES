"use client";

import { useState, useEffect } from "react";
import {
  Terminal,
  Cpu,
  Database,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Lock,
  Zap,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHECK_STEPS = [
  { id: "backend", label: "Backend", endpoint: "/", extract: (data) => "Conectado" },
  { id: "api", label: "API", endpoint: "/status", extract: (data) => data.service || "Online" },
  { id: "modelo", label: "Modelo", endpoint: "/status/full", extract: (data) => data.provider || "NVIDIA NIM" },
  { id: "kb", label: "Knowledge Base", endpoint: "/status/full", extract: (data) => `${data.kbDocuments || 9} documentos indexados` },
  { id: "agente", label: "Agente", endpoint: "/status/full", extract: (data) => (data.modelStatus === "online" ? "ONLINE" : "Conectado") },
];

function CheckItem({ label, detail, status }) {
  const Icon =
    status === "success"
      ? CheckCircle2
      : status === "error"
      ? XCircle
      : status === "loading"
      ? Loader2
      : null;

  const color =
    status === "success"
      ? "text-red-400"
      : status === "error"
      ? "text-red-600"
      : "text-zinc-600";

  return (
    <div className="flex items-center gap-3 font-mono text-sm">
      {Icon ? (
        <Icon
          className={`h-4 w-4 shrink-0 ${
            status === "loading" ? "animate-spin text-red-400" : color
          }`}
          style={
            status === "success"
              ? { filter: "drop-shadow(0 0 6px rgba(239,68,68,0.9))" }
              : status === "loading"
              ? { filter: "drop-shadow(0 0 6px rgba(239,68,68,0.7))" }
              : undefined
          }
        />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-zinc-800" />
      )}
      <span className={status ? "text-zinc-100" : "text-zinc-600"}>{label}</span>
      {detail && (
        <span
          className={`ml-auto text-xs ${color}`}
          style={
            status === "success"
              ? { textShadow: "0 0 6px rgba(239,68,68,0.6)" }
              : undefined
          }
        >
          {detail}
        </span>
      )}
    </div>
  );
}

export default function AresLoadingBar({ onComplete }) {
  const [checks, setChecks] = useState(
    CHECK_STEPS.map((s) => ({ id: s.id, label: s.label, status: "pending", detail: null }))
  );
  const [systemInfo, setSystemInfo] = useState(null);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function step(index) {
      if (index >= CHECK_STEPS.length) {
        if (!cancelled) {
          setAllDone(true);
          setTimeout(() => onComplete?.(), 1000);
        }
        return;
      }

      const check = CHECK_STEPS[index];

      setChecks((prev) =>
        prev.map((c) =>
          c.id === check.id ? { ...c, status: "loading", detail: "..." } : c
        )
      );

      await new Promise((r) => setTimeout(r, 350));

      if (cancelled) return;

      try {
        const res = await fetch(`${API_URL}${check.endpoint}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const detail = check.extract(data);

        if (check.id === "modelo") {
          setSystemInfo((prev) => ({
            ...prev,
            provider: data.provider || "NVIDIA NIM",
            model: data.model || "DeepSeek V4 Flash",
          }));
        }
        if (check.id === "kb") {
          setSystemInfo((prev) => ({ ...prev, kbDocs: data.kbDocuments || 9 }));
        }
        if (check.id === "api") {
          setSystemInfo((prev) => ({ ...prev, mode: "Learning" }));
        }
        if (check.id === "agente") {
          setSystemInfo((prev) => ({
            ...prev,
            status: data.modelStatus === "online" ? "ONLINE" : "Conectado",
          }));
        }

        setChecks((prev) =>
          prev.map((c) =>
            c.id === check.id ? { ...c, status: "success", detail } : c
          )
        );
      } catch {
        setChecks((prev) =>
          prev.map((c) =>
            c.id === check.id ? { ...c, status: "error", detail: "Falló" } : c
          )
        );
      }

      await new Promise((r) => setTimeout(r, 250));
      if (!cancelled) step(index + 1);
    }

    step(0);
    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  // ===== Datos derivados para la barra segmentada =====
  const segments = CHECK_STEPS.length * 2; // 10 segmentos
  const completed = checks.filter((c) => c.status === "success" || c.status === "error").length;
  const filled = Math.round((completed / CHECK_STEPS.length) * segments);
  const loadingIdx = checks.findIndex((c) => c.status === "loading");
  const headFill = loadingIdx >= 0 ? Math.floor((loadingIdx / CHECK_STEPS.length) * segments) : filled;

  const statusLine = allDone
    ? "Handshake completado — ARES listo para operar."
    : loadingIdx >= 0
    ? `Verificando ${CHECK_STEPS[loadingIdx].label.toLowerCase()}…`
    : "Inicializando núcleo ARES…";

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden font-mono">
      {/* ===== Fondo cyberpunk (mismo del AresLoadingBar) ===== */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.07)_1px,transparent_1px)] bg-[length:32px_32px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.18),transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.45)_0px,rgba(0,0,0,0.45)_1px,transparent_1px,transparent_3px)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.9)_100%)]" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-lg">
        {/* ===== Logo ARES ===== */}
        <div className="flex items-center gap-3">
          <Cpu
            className="w-6 h-6 text-red-500 animate-pulse"
            style={{ filter: "drop-shadow(0 0 10px rgba(239,68,68,0.9))" }}
          />
          <span
            className="text-red-500 text-2xl tracking-[0.4em] font-bold"
            style={{
              textShadow:
                "0 0 10px rgba(239,68,68,0.9), 0 0 22px rgba(239,68,68,0.55)",
            }}
          >
            ARES
          </span>
          <Cpu
            className="w-6 h-6 text-red-500 animate-pulse"
            style={{ filter: "drop-shadow(0 0 10px rgba(239,68,68,0.9))" }}
          />
        </div>

        {/* ===== Título ===== */}
        <h1
          className="text-zinc-100 text-3xl md:text-4xl font-bold tracking-[0.1em] font-mono"
          style={{
            textShadow:
              "0 0 12px rgba(239,68,68,0.75), 0 0 28px rgba(239,68,68,0.45)",
            animation: "flicker 3s infinite",
          }}
        >
          {allDone ? "Sistema Listo" : "Inicializando ARES"}
        </h1>

        {/* ===== Barra segmentada ARES ===== */}
        <div className="relative w-full">
          {/* brackets externos */}
          <span
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-red-500"
            style={{ boxShadow: "0 0 10px rgba(239,68,68,1)" }}
          />
          <span
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-red-500"
            style={{ boxShadow: "0 0 10px rgba(239,68,68,1)" }}
          />

          <div
            className="flex items-center justify-between gap-1.5 px-3 py-2 border-[3px] border-red-500 rounded-sm"
            style={{
              boxShadow:
                "0 0 18px rgba(239,68,68,0.7), inset 0 0 18px rgba(239,68,68,0.22)",
            }}
          >
            {Array.from({ length: segments }).map((_, i) => {
              const isFilled = i < headFill;
              const isHead = i === headFill && !allDone;
              return (
                <div
                  key={i}
                  className={`flex-1 h-6 transition-all duration-200 ${
                    isFilled ? "bg-red-500" : isHead ? "bg-red-500/70" : "bg-red-950/40"
                  }`}
                  style={
                    isFilled || isHead
                      ? {
                          boxShadow:
                            "0 0 8px rgba(239,68,68,1), 0 0 14px rgba(239,68,68,0.6)",
                        }
                      : { boxShadow: "inset 0 0 4px rgba(239,68,68,0.22)" }
                  }
                />
              );
            })}
          </div>
        </div>

        {/* ===== Panel de chequeos ===== */}
        <div className="w-full rounded-lg border border-red-500/30 bg-black/70 backdrop-blur-sm overflow-hidden"
          style={{ boxShadow: "0 0 20px rgba(239,68,68,0.18), inset 0 0 20px rgba(239,68,68,0.08)" }}
        >
          {/* Header del panel */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-red-500/20 bg-red-950/20">
            <div className="flex items-center gap-2 text-red-400 text-xs tracking-widest"
              style={{ textShadow: "0 0 6px rgba(239,68,68,0.7)" }}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>SYSTEM_DIAGNOSTIC</span>
            </div>
            <span className="text-red-500/70 text-[10px] tracking-widest">
              {String(completed).padStart(2, "0")}/{String(CHECK_STEPS.length).padStart(2, "0")}
            </span>
          </div>

          {/* Grid de subsistemas (post-load) */}
          {allDone && systemInfo && (
            <div className="grid grid-cols-2 gap-px bg-red-950/30 border-b border-red-500/20">
              {[
                { icon: Wifi, label: "Proveedor", value: systemInfo.provider || "NVIDIA NIM" },
                { icon: Cpu, label: "Modelo", value: systemInfo.model || "DeepSeek V4 Flash" },
                { icon: Database, label: "Knowledge Base", value: `${systemInfo.kbDocs || 9} docs` },
                { icon: Shield, label: "Estado", value: systemInfo.status || "Conectado" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-0.5 bg-black/70 px-3 py-2.5">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-red-500/60">
                    {item.label}
                  </span>
                  <span className="text-xs font-medium text-zinc-100">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Lista de checks */}
          <div className="flex flex-col gap-1.5 p-4">
            {checks.map((c) => (
              <CheckItem key={c.id} label={c.label} detail={c.detail} status={c.status} />
            ))}
          </div>
        </div>

        {/* ===== Línea de estado tipo terminal ===== */}
        <div className="flex items-center gap-2 text-red-400 text-xs tracking-wider font-mono">
          <Terminal className="h-3.5 w-3.5" />
          <span style={{ textShadow: "0 0 6px rgba(239,68,68,0.6)" }}>
            {"> "}{statusLine}
          </span>
        </div>

        {/* ===== Footer de subsistemas ===== */}
        <div className="flex gap-5 text-red-500/70 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.8))" }} />
            <span>AES-256</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.8))" }} />
            <span>NEURAL CORE</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.8))" }} />
            <span>SHIELD ACTIVO</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
