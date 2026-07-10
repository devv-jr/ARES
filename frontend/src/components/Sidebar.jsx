import {
  Plus,
  MessageSquare,
  FolderArchive,
  ScrollText,
  FlaskConical,
  BookOpen,
  Wrench,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
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

export default function Sidebar({ onNewSession, activeSection, onSectionChange }) {
  const items = [
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "lab", icon: FlaskConical, label: "Laboratorio" },
    { id: "console", icon: ScrollText, label: "PLAYBOOKS" },
    { id: "evidencias", icon: FolderArchive, label: "Evidencias" },
    { id: "kb", icon: BookOpen, label: "Knowledge Base" },
    { id: "tools", icon: Wrench, label: "Herramientas" },
  ]

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="w-full max-w-[160px] leading-tight">
          <Image
            src="/ares.png"
            alt="ARES Logo"
            width={120}
            height={120}
            className="h-auto w-full object-contain"
          />
        </div>
      </div>

      <div className="px-3">
        <button
          onClick={onNewSession}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-red-600 to-purple-800 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva Sesión
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-col gap-0.5 pt-4">
          {items.map((item) => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </div>
      </nav>

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
