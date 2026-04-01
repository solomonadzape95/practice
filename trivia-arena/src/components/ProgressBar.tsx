export function ProgressBar({
  current,
  total,
  color,
}: {
  current: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-q-sub">
        <span>
          {current} <span className="text-q-dim">/ {total}</span>
        </span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
