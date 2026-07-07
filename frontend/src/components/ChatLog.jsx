import { useEffect, useRef } from "react"
import { TriangleAlert } from "lucide-react"
import ChatMessage from "./ChatMessage"
import TypingIndicator from "./TypingIndicator"

export default function ChatLog({ messages, error, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, error, loading])

  if (messages.length === 0 && !error && !loading) return null

  return (
    <div className="mb-4 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4 backdrop-blur-md">
      {messages.map((m, i) => (
        <ChatMessage key={i} role={m.role} content={m.content} />
      ))}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
