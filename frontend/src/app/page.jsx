"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { API_URL } from "../lib/constants"
import Sidebar from "../components/Sidebar"
import TopNav from "../components/TopNav"
import AiCore from "../components/AiCore"
import InputArea from "../components/InputArea"
import ChatLog from "../components/ChatLog"
import OpsPanel from "../components/OpsPanel"
import StatusPanel from "../components/StatusPanel"
import KnowledgeBaseView from "../components/KnowledgeBaseView"
import EvidenciasPanel from "../components/EvidenciasPanel"
import AresLoadingBar from "../components/Onboarding/AresLoadingBar";

export default function AresDashboard() {
  const [showLoading, setShowLoading] = useState(true)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedMode, setSelectedMode] = useState("learning")
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("chat")
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const topNavRef = useRef(null)
  const sessionIdRef = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "default")

  useEffect(() => {
    function handleOutsideClick(event) {
      if (topNavRef.current && !topNavRef.current.contains(event.target)) {
        setModeMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setModeMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setLoading(true)

    let assistantIndex = -1
    setMessages((prev) => {
      assistantIndex = prev.length
      return [...prev, { role: "assistant", content: "" }]
    })

    function appendToAssistant(piece) {
      setMessages((prev) => {
        const next = [...prev]
        next[assistantIndex] = {
          ...next[assistantIndex],
          content: next[assistantIndex].content + piece,
        }
        return next
      })
    }

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode: selectedMode, session_id: sessionIdRef.current }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`El servidor respondió con estado ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let receivedAny = false

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const rawEvent of events) {
          const line = rawEvent.trim()
          if (!line.startsWith("data: ")) continue
          const payload = line.slice("data: ".length)

          if (payload === "[DONE]") continue

          try {
            const piece = JSON.parse(payload)
            if (piece) {
              receivedAny = true
              appendToAssistant(piece)
            }
          } catch {
            // ignore invalid JSON fragments
          }
        }
      }

      if (!receivedAny) {
        appendToAssistant("ARES no devolvió contenido. Intenta de nuevo.")
      }
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "No se pudo conectar con el backend de ARES. Verifica que esté corriendo."
          : err.message
      )
      setMessages((prev) => prev.filter((_, i) => i !== assistantIndex || prev[i].content))
    } finally {
      setLoading(false)
    }
  }

  function handleNewSession() {
    setMessages([])
    setError(null)
    setInput("")
    setLoading(false)
    setHasInitialized(false)
    setDashboardOpen(false)
    sessionIdRef.current = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "default"
  }

  function handleOrbeClick() {
    setDashboardOpen(true)
    setLoading(true)

    const bootLines = [
      "> Conectando al backend de inteligencia...",
      "> Handshake completado \u2014 token v\u00e1lido",
      "> Indexando vectores de la sesi\u00f3n actual...",
      "> Pipeline de procesamiento en l\u00ednea",
      "> M\u00f3dulo de an\u00e1lisis sincronizado (1.2s)",
      "> ARES listo.",
    ]

    let assistantIndex = -1
    setMessages((prev) => {
      assistantIndex = prev.length + 1
      return [
        ...prev,
        { role: "user", content: "Inicializar ARES" },
        { role: "assistant", content: "" },
      ]
    })

    bootLines.forEach((line, i) => {
      setTimeout(() => {
        setMessages((prev) => {
          const next = [...prev]
          next[assistantIndex] = {
            ...next[assistantIndex],
            content: next[assistantIndex].content
              ? next[assistantIndex].content + "\n" + line
              : line,
          }
          return next
        })
        if (i === bootLines.length - 1) {
          setTimeout(() => {
            setHasInitialized(true)
            setLoading(false)
          }, 700)
        }
      }, (i + 1) * 350)
    })
  }

  function handleModeChange(mode) {
    setSelectedMode(mode)
    setModeMenuOpen(false)
  }

  function handleLoadingComplete() {
    setShowLoading(false)
  }

  if (showLoading) {
    return <AresLoadingBar onComplete={handleLoadingComplete} duration={4500} />
  }

  return (
    <div className="dark flex h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat text-zinc-100" style={{ backgroundImage: 'url(/background.png)' }}>
      <AnimatePresence>
        {dashboardOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Sidebar onNewSession={handleNewSession} activeSection={activeSection} onSectionChange={setActiveSection} />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-red-900/20 blur-[120px]" />

        <div className="relative z-10 flex h-full flex-col">
          <AnimatePresence>
            {dashboardOpen && (
              <motion.div
                key="topnav"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                ref={topNavRef}
              >
                <TopNav
                  selectedMode={selectedMode}
                  onModeChange={handleModeChange}
                  modeMenuOpen={modeMenuOpen}
                  setModeMenuOpen={setModeMenuOpen}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex flex-1 flex-col overflow-y-auto ${activeSection === "kb" || activeSection === "evidencias" ? "px-6" : "px-6 py-8"}`}>
            {activeSection !== "kb" && activeSection !== "console" && activeSection !== "evidencias" && (
              <div className="flex flex-1 flex-col">
                <AnimatePresence mode="wait">
                  {!dashboardOpen ? (
                    <motion.div
                      key="hero"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="relative flex flex-1 flex-col items-center justify-center gap-6"
                    >
                      <div className="ares-beam pointer-events-none absolute bottom-0 left-1/2 h-48 w-[36rem] max-w-[90vw] -translate-x-1/2 translate-y-1/3" />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative z-10"
                      >
                        <AiCore onClick={handleOrbeClick} />
                      </motion.div>
                      <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        className="ares-hero-title relative z-10 text-balance text-center text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
                      >
                        {"\u00bf"}Qu{"\u00e9"} vamos a auditar hoy?
                      </motion.h1>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="flex-1"
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            {dashboardOpen && activeSection === "chat" && (
              <>
                <motion.div layout className="flex flex-col items-center">
                  <ChatLog messages={messages} error={error} loading={loading} />
                  {hasInitialized && (
                    <InputArea value={input} onChange={setInput} onSend={handleSend} loading={loading} />
                  )}
                </motion.div>

                {hasInitialized && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8 flex justify-center px-2 pb-8"
                  >
                    <StatusPanel mode={selectedMode} />
                  </motion.div>
                )}
              </>
            )}

            {dashboardOpen && activeSection === "kb" && (
              <div className="flex flex-col items-center flex-1 justify-center overflow-y-auto pt-12">
                <KnowledgeBaseView />
              </div>
            )}

            {dashboardOpen && activeSection === "evidencias" && (
              <div className="flex flex-col items-center flex-1 overflow-y-auto pt-12">
                <EvidenciasPanel />
              </div>
            )}

            {dashboardOpen && activeSection === "console" && (
              <div className="flex flex-col items-center pt-8">
                <OpsPanel />
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-8 flex justify-center px-2 pb-8"
                >
                  <StatusPanel mode={selectedMode} />
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
