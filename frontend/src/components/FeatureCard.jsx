export default function FeatureCard({ icon: Icon, tag, title, description }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md transition-colors hover:border-red-900/50">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60">
          <Icon className="h-4 w-4 text-red-500" />
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {tag}
        </span>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
    </div>
  )
}
