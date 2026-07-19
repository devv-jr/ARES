"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  ChevronRight,
  Search,
  FileText,
  BookOpen,
  ShieldAlert,
  Terminal,
  Cpu,
  Code2,
  Skull,
  Binary,
  Activity,
  Hash,
} from "lucide-react"
import KBMarkdown from "./KBMarkdown"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Iconografía técnica — un icono por categoría, tono único de acento.
// Se mantienen las mismas keys que envía el backend (cat.icon) para no
// romper la integración; solo cambia el icono renderizado.
const ICON_MAP = {
  Shield: ShieldAlert,
  Terminal: Terminal,
  Monitor: Cpu,
  Code: Code2,
  Bug: Skull,
  Layers: Binary,
  ShieldCheck: Activity,
  Flame: Hash,
}

function CategoryIcon({ Icon, active }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ${
        active ? "bg-red-500/10" : "bg-transparent"
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 transition-colors duration-200 ${
          active ? "text-red-400" : "text-neutral-500"
        }`}
        strokeWidth={2}
      />
    </span>
  )
}

function SubcategoryItem({ sub, isActive, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full rounded-md px-2.5 py-1.5 text-left text-[11px] font-mono transition-all duration-150 ${
        isActive
          ? "border-l-2 border-red-500/70 bg-red-500/[0.06] text-neutral-100"
          : "border-l-2 border-transparent text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-300"
      }`}
    >
      <div className="truncate">{sub.name}</div>
      <div className="mt-0.5 truncate text-[10px] font-normal text-neutral-600">{sub.summary}</div>
    </motion.button>
  )
}

export default function KnowledgeBaseView() {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeSub, setActiveSub] = useState(null)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K")
  const searchRef = useRef(null)

  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
      setShortcutLabel("\u2318 K")
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      if (isShortcut) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/kb/categories`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0])
      })
      .catch(() => {})
  }, [])

  const loadContent = useCallback(async (catId, subId) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/kb/content?category_id=${catId}&subcategory_id=${subId}`)
      if (res.ok) {
        const data = await res.json()
        setContent(data)
      }
    } catch {}
    setLoading(false)
  }, [])

  function handleCategoryClick(cat) {
    setActiveCategory(cat)
    setActiveSub(null)
    setContent(null)
  }

  function handleSubClick(sub) {
    setActiveSub(sub)
    loadContent(activeCategory.id, sub.id)
  }

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      subcategories: cat.subcategories.filter(
        (sub) =>
          !search ||
          sub.name.toLowerCase().includes(search.toLowerCase()) ||
          sub.summary.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => !search || cat.subcategories.length > 0 || cat.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full max-w-5xl font-mono">
      <div
        className="relative overflow-hidden rounded-[10px] border border-red-500/20 bg-neutral-950/70 backdrop-blur-xl"
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 0 40px -18px rgba(244,63,94,0.25)" }}
      >
        {/* Cabecera — búsqueda */}
        <div className="border-b border-neutral-800/40 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en knowledge base..."
              className="w-full rounded-md border border-neutral-800/60 bg-neutral-900/40 py-2 pl-9 pr-16 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none transition-colors focus:border-red-500/30"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-neutral-700/50 bg-neutral-800/60 px-1.5 py-0.5 text-[10px] text-neutral-500">
              {shortcutLabel}
            </kbd>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Columna izquierda — categorías */}
          <div className="border-neutral-800/40 p-2.5 lg:w-64 lg:border-r max-h-[520px] overflow-y-auto">
            <div className="flex flex-col gap-0.5">
              {filteredCategories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Terminal
                const isActive = activeCategory?.id === cat.id
                return (
                  <div key={cat.id}>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleCategoryClick(cat)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all duration-150 ${
                        isActive
                          ? "bg-gradient-to-r from-red-500/10 via-red-500/[0.04] to-transparent"
                          : "hover:bg-neutral-900/50"
                      }`}
                      style={
                        isActive
                          ? { boxShadow: "inset 2px 0 0 0 rgba(244,63,94,0.65)" }
                          : undefined
                      }
                    >
                      <CategoryIcon Icon={Icon} active={isActive} />
                      <span
                        className={`text-[11px] font-semibold tracking-wide ${
                          isActive ? "text-white" : "text-neutral-500"
                        }`}
                      >
                        {cat.name}
                      </span>
                      <ChevronRight
                        className={`ml-auto h-3 w-3 shrink-0 text-neutral-700 transition-transform duration-200 ${
                          isActive ? "rotate-90 text-red-400/70" : ""
                        }`}
                      />
                    </motion.button>

                    <AnimatePresence>
                      {isActive && cat.subcategories.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mb-1 mt-1 flex flex-col gap-0.5 border-l border-neutral-800/60 pl-2">
                            {cat.subcategories.map((sub) => (
                              <SubcategoryItem
                                key={sub.id}
                                sub={sub}
                                isActive={activeSub?.id === sub.id}
                                onClick={() => handleSubClick(sub)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Columna derecha — visor de artículo */}
          <div className="max-h-[520px] flex-1 overflow-y-auto bg-transparent p-5">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400/80" />
                Cargando contenido...
              </div>
            ) : content ? (
              <motion.div
                key={content.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-4 flex items-center gap-2 border-b border-neutral-800/40 pb-3">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-red-400/80" strokeWidth={2} />
                  <span className="text-[11px] text-neutral-600">{content.category}</span>
                  <ChevronRight className="h-3 w-3 text-neutral-700" />
                  <span className="text-[13px] font-semibold text-white">{content.title}</span>
                </div>
                <KBMarkdown content={content.content} />
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BookOpen className="mb-3 h-8 w-8 text-neutral-700" strokeWidth={1.5} />
                <p className="text-xs text-neutral-600">Selecciona una categoría y un tema</p>
                <p className="mt-1 text-[10px] text-neutral-700">
                  {categories.length} categorías con recursos de ciberseguridad
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
