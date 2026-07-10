"use client"

// Paletas de color por categoría/estado. Cada una define un degradado
// "glossy" (primary -> secondary) más un color de resplandor (glow)
// que se usa en el box-shadow cuando el icono está activo.
export const ICON_PALETTES = {
  owasp: { primary: "#f87171", secondary: "#7f1d1d", glow: "rgba(239,68,68,0.45)" },
  linux: { primary: "#facc15", secondary: "#713f12", glow: "rgba(234,179,8,0.45)" },
  windows: { primary: "#60a5fa", secondary: "#1e3a8a", glow: "rgba(59,130,246,0.45)" },
  python: { primary: "#4ade80", secondary: "#14532d", glow: "rgba(34,197,94,0.45)" },
  malware: { primary: "#c084fc", secondary: "#581c87", glow: "rgba(168,85,247,0.45)" },
  mitre: { primary: "#fb923c", secondary: "#7c2d12", glow: "rgba(249,115,22,0.45)" },
  "blue-team": { primary: "#22d3ee", secondary: "#164e63", glow: "rgba(34,211,238,0.45)" },
  "red-team": { primary: "#fb7185", secondary: "#881337", glow: "rgba(244,63,94,0.45)" },
  purple: { primary: "#c084fc", secondary: "#581c87", glow: "rgba(168,85,247,0.45)" },
  cyan: { primary: "#22d3ee", secondary: "#164e63", glow: "rgba(34,211,238,0.45)" },
  green: { primary: "#4ade80", secondary: "#14532d", glow: "rgba(34,197,94,0.45)" },
  red: { primary: "#f87171", secondary: "#7f1d1d", glow: "rgba(239,68,68,0.45)" },
  zinc: { primary: "#a1a1aa", secondary: "#27272a", glow: "rgba(113,113,122,0.35)" },
  default: { primary: "#a1a1aa", secondary: "#27272a", glow: "rgba(113,113,122,0.35)" },
}

/**
 * Icono estilo "3D badge": una placa con degradado + brillo superior +
 * sombra interior, que da sensación de volumen sin usar imágenes externas
 * (evita logos con copyright y dependencias de red que se puedan romper).
 *
 * Recibe cualquier icono de lucide-react vía la prop `icon`.
 */
export default function Icon3D({
  icon: Icon,
  palette,
  active = false,
  size = "h-8 w-8",
  iconSize = "h-4 w-4",
  spin = false,
  rounded = "rounded-xl",
  className = "",
}) {
  const p = palette || ICON_PALETTES.default

  return (
    <div
      className={`relative ${size} ${rounded} shrink-0 flex items-center justify-center transition-all duration-300 ${
        active ? "scale-105" : ""
      } ${className}`}
      style={{
        background: `linear-gradient(150deg, ${p.primary} 0%, ${p.secondary} 100%)`,
        boxShadow: active
          ? `0 4px 16px -2px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -6px 10px rgba(0,0,0,0.35)`
          : `0 2px 8px -3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -6px 10px rgba(0,0,0,0.35)`,
      }}
    >
      {/* brillo superior tipo "gloss" */}
      <div
        className={`pointer-events-none absolute inset-x-1 top-0.5 h-1/2 ${rounded} bg-white/25 blur-[3px]`}
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      />
      <Icon
        className={`relative ${iconSize} text-white ${spin ? "animate-spin" : ""}`}
        strokeWidth={2.2}
        style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))" }}
      />
    </div>
  )
}
