"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CircuitBoard, Database, Wifi, Atom, Cpu } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const MODE_LABELS = {
  learning: "Learning",
  blue_team: "Blue Team",
  red_team: "Red Team",
  developer: "Developer",
}

export default function StatusPanel({ mode }) {
  const [data, setData] = useState({
    model: "DeepSeek V4 Flash",
    modelStatus: "online",
    kbDocuments: 412,
    status: "Conectado",
    provider: "NVIDIA NIM",
  })

  useEffect(() => {
    fetch(`${API_URL}/status/full`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json) setData((prev) => ({ ...prev, ...json }))
      })
      .catch(() => {})
  }, [])

  const items = [
    { icon: CircuitBoard, label: "MODELO", value: data.model, badge: data.modelStatus, badgeColor: "text-green-400" },
    { icon: Database, label: "KNOWLEDGE BASE", value: `${data.kbDocuments} documentos`, badge: null },
    { icon: Wifi, label: "ESTADO", value: data.status, badge: null },
    { icon: Atom, label: "MODO", value: MODE_LABELS[mode] || mode || "Learning", badge: null },
    { icon: Cpu, label: "PROVEEDOR", value: data.provider, badge: null },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl font-mono"
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm">
        <div className="border-b border-zinc-800/60 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Estado de ARES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-zinc-800/40">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1 bg-zinc-950/60 px-3 py-3">
              <div className="flex items-center gap-1.5">
                <item.icon className="h-3 w-3 text-zinc-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">{item.value}</span>
                {item.badge && (
                  <span className={`text-[10px] font-semibold uppercase ${item.badgeColor}`}>{item.badge}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
