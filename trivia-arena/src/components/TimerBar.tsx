import { motion } from 'framer-motion'

interface TimerBarProps {
  /** 0 → 1, where 1 = full time remaining, 0 = expired */
  pct: number
  /** Accent color from the current mode */
  color: string
  /** When true, renders nothing */
  hidden: boolean
}

function barColor(pct: number, modeColor: string): string {
  if (pct > 0.5) return modeColor
  if (pct > 0.2) return '#F59E0B' // amber
  return '#FF3F5E' // red
}

export function TimerBar({ pct, color, hidden }: TimerBarProps) {
  if (hidden) return null

  const bg = barColor(pct, color)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-1.5 bg-white/8">
      <motion.div
        className="h-full origin-left rounded-full"
        style={{ backgroundColor: bg, width: `${pct * 100}%` }}
        transition={{ duration: 0.05, ease: 'linear' }}
      />
    </div>
  )
}
