"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ChevronRight, BookOpen, Shield, Terminal, Monitor, Code, Bug, Layers, ShieldCheck, Flame, Search, FileText } from "lucide-react"
import Icon3D, { ICON_PALETTES } from "./Icon3D"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const ICON_MAP = {
  Shield,
  Terminal,
  Monitor,
  Code,
  Bug,
  Layers,
  ShieldCheck,
  Flame,
}

const COLOR_MAP = {
  owasp: "text-red-400 border-red-900/40",
  linux: "text-yellow-400 border-yellow-900/40",
  windows: "text-blue-400 border-blue-900/40",
  python: "text-green-400 border-green-900/40",
  malware: "text-purple-400 border-purple-900/40",
  mitre: "text-orange-400 border-orange-900/40",
  "blue-team": "text-cyan-400 border-cyan-900/40",
  "red-team": "text-rose-400 border-rose-900/40",
}

const BG_MAP = {
  owasp: "hover:border-red-800/60",
  linux: "hover:border-yellow-800/60",
  windows: "hover:border-blue-800/60",
  python: "hover:border-green-800/60",
  malware: "hover:border-purple-800/60",
  mitre: "hover:border-orange-800/60",
  "blue-team": "hover:border-cyan-800/60",
  "red-team": "hover:border-rose-800/60",
}

function renderContent(markdown) {
  const lines = markdown.split("\n")
  const html = []
  let inCodeBlock = false
  let codeContent = []
  let codeLang = ""
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push(`<pre class="kb-code">${codeContent.join("\n")}</pre>`)
        codeContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLang = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
      continue
    }

    if (line.startsWith("### ")) {
      html.push(`<h3 class="kb-h3">${line.slice(4)}</h3>`)
    } else if (line.startsWith("## ")) {
      html.push(`<h2 class="kb-h2">${line.slice(3)}</h2>`)
    } else if (line.startsWith("| ")) {
      if (!line.includes("---")) {
        const cells = line.split("|").filter(Boolean).map((c) => c.trim())
        html.push(`<tr>${cells.map((c) => `<td class="kb-td">${c}</td>`).join("")}</tr>`)
      }
    } else if (line.startsWith("- **")) {
      const match = line.match(/- \*\*(.+?)\*\*(.*)/)
      if (match) {
        html.push(`<p class="kb-p"><span class="font-bold text-zinc-200">${match[1]}</span>${match[2]}</p>`)
      }
    } else if (line.startsWith("- ")) {
      html.push(`<li class="kb-li">${line.slice(2)}</li>`)
    } else if (line.match(/^\d+\. /)) {
      html.push(`<li class="kb-li list-decimal ml-4">${line.replace(/^\d+\.\s*/, "")}</li>`)
    } else if (line.startsWith("|")) {
      continue
    } else if (line.trim() === "") {
      html.push("")
    } else {
      html.push(`<p class="kb-p">${line}</p>`)
    }
  }

  return html.join("\n")
}

function SubcategoryItem({ sub, categoryId, isActive, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all ${
        isActive
          ? "bg-zinc-800/80 text-zinc-100 border-l-2 border-green-400"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
      }`}
    >
      <div className="font-medium">{sub.name}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5 line-clamp-1">{sub.summary}</div>
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
      <div className="rounded-t-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-400 font-semibold">KNOWLEDGE BASE</span>
          <span className="text-zinc-500">{categories.length} categorías</span>
        </div>
        <div className="mt-1.5 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en knowledge base..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md pl-7 pr-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      <div className="border-x border-b border-zinc-800 rounded-b-lg bg-black/60">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-80 border-r border-zinc-800/60 p-3 max-h-[520px] overflow-y-auto">
            <div className="flex flex-col gap-1">
              {filteredCategories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || BookOpen
                const color = COLOR_MAP[cat.id] || "text-zinc-400"
                const hover = BG_MAP[cat.id] || "hover:border-zinc-700"
                const palette = ICON_PALETTES[cat.id] || ICON_PALETTES.default
                const isActive = activeCategory?.id === cat.id
                return (
                  <div key={cat.id}>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleCategoryClick(cat)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs transition-all border ${
                        isActive
                          ? `${color} bg-zinc-900/80`
                          : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/40"
                      } ${isActive ? "" : hover}`}
                    >
                      <Icon3D icon={Icon} palette={palette} active={isActive} size="h-8 w-8" iconSize="h-4 w-4" />
                      <span className="font-semibold tracking-wider">{cat.name}</span>
                      <ChevronRight
                        className={`h-3 w-3 ml-auto shrink-0 transition-transform ${
                          isActive ? "rotate-90" : ""
                        }`}
                      />
                    </motion.button>

                    <AnimatePresence>
                      {isActive && cat.subcategories.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-0.5 ml-4 mt-1 mb-1 pl-2 border-l border-zinc-800">
                            {cat.subcategories.map((sub) => (
                              <SubcategoryItem
                                key={sub.id}
                                sub={sub}
                                categoryId={cat.id}
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

          <div className="flex-1 p-4 max-h-[520px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                Cargando contenido...
              </div>
            ) : content ? (
              <motion.div
                key={content.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon3D
                    icon={FileText}
                    palette={ICON_PALETTES[activeCategory?.id] || ICON_PALETTES.default}
                    active
                    size="h-7 w-7"
                    iconSize="h-3.5 w-3.5"
                    rounded="rounded-lg"
                  />
                  <span className="text-xs text-zinc-500">{content.category}</span>
                  <ChevronRight className="h-3 w-3 text-zinc-700" />
                  <span className="text-sm font-semibold text-zinc-200">{content.title}</span>
                </div>
                <div
                  className="kb-render text-xs text-zinc-300 leading-relaxed space-y-2"
                  dangerouslySetInnerHTML={{ __html: renderContent(content.content) }}
                />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon3D icon={BookOpen} palette={ICON_PALETTES.default} size="h-14 w-14" iconSize="h-6 w-6" className="mb-3" />
                <p className="text-sm text-zinc-600">Selecciona una categoría y un tema</p>
                <p className="text-[10px] text-zinc-700 mt-1">
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
