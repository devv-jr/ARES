import { motion } from "framer-motion"
import { Shield } from "lucide-react"
import MarkdownRenderer from "./MarkdownRenderer"

export default function ChatMessage({ role, content }) {
  const isUser = role === "user"
  return (
    <motion.div layout="position" className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl border px-4 py-2.5 text-sm backdrop-blur-md ${
          isUser
            ? "border-red-900/40 bg-linear-to-br from-red-950/60 to-purple-950/40 text-zinc-100"
            : "border-zinc-800 bg-zinc-900/50 text-zinc-300"
        }`}
      >
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-500">
            <Shield className="h-3 w-3" />
            ARES
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        ) : (
          <div className="prose-invert max-w-none break-words">
            <MarkdownRenderer>{content}</MarkdownRenderer>
          </div>
        )}
      </div>
    </motion.div>
  )
}
