import { motion } from "framer-motion"
import { Shield } from "lucide-react"

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <Shield className="h-3 w-3 text-red-500" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">ARES</span>
      <span className="flex items-center gap-0.5 ml-1">
        <motion.span
          className="h-1 w-1 rounded-full bg-zinc-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="h-1 w-1 rounded-full bg-zinc-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="h-1 w-1 rounded-full bg-zinc-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </span>
    </div>
  )
}
