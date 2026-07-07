import { motion, useMotionValue, useSpring } from "framer-motion"

export default function AiCore({ onClick }) {
  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const offsetX = (e.clientX - centerX) / 15
    x.set(Math.max(-15, Math.min(15, offsetX)))
  }

  function handleMouseLeave() {
    x.set(0)
  }

  return (
    <motion.div
      style={{ x: springX }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative flex h-32 w-32 cursor-pointer items-center justify-center"
    >
      <div className="ares-core-ring absolute inset-0 rounded-full border border-dashed border-red-500/40" />
      <div className="ares-core-ring absolute inset-3 rounded-full border border-pink-500/30" />
      <div className="ares-core h-24 w-24 rounded-full bg-linear-to-br from-pink-400 via-red-600 to-red-950" />
      <div className="pointer-events-none absolute left-1/2 top-9 h-4 w-4 -translate-x-1/2 rounded-full bg-white/60 blur-md" />
    </motion.div>
  )
}
