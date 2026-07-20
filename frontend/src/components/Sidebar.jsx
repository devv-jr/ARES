import { useState } from "react"
import {
  Plus,
  MessageSquare,
  FolderArchive,
  ScrollText,
  FlaskConical,
  BookOpen,
  Wrench,
  X,
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
      <span className="truncate uppercase tracking-wider">{label}</span>
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

function ConversationItem({ conversation, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(conversation.title)

  function handleDoubleClick(e) {
    e.stopPropagation()
    setEditing(true)
    setEditValue(conversation.title)
  }

  function handleSave() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed)
    }
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") setEditing(false)
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
        isActive
          ? "bg-zinc-800/60"
          : "hover:bg-zinc-800/40"
      }`}
    >
      {editing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="flex-1 bg-transparent text-sm text-zinc-200 outline-none border-b border-zinc-600"
        />
      ) : (
        <button
          onClick={() => onSelect(conversation)}
          onDoubleClick={handleDoubleClick}
          className="flex flex-1 items-center gap-2 truncate text-left"
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span className="truncate text-sm text-zinc-300">{conversation.title}</span>
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(conversation.id) }}
        className="shrink-0 text-zinc-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function Sidebar({
  onNewSession,
  activeSection,
  onSectionChange,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}) {
  const items = [
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "lab", icon: FlaskConical, label: "Laboratorio" },
    { id: "console", icon: ScrollText, label: "Playbooks" },
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

      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-col gap-0.5 pt-4">
          <SectionLabel>Navegación</SectionLabel>
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

        {conversations && conversations.length > 0 && (
          <div className="pt-4">
            <SectionLabel>Historial</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === currentConversationId}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                  onRename={onRenameConversation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
