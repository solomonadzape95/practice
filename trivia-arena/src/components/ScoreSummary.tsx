import { motion } from 'framer-motion'

function messageFor(pct: number) {
  if (pct === 100) return '🏆 Perfect score!'
  if (pct >= 90) return 'Outstanding!'
  if (pct >= 70) return 'Great work!'
  if (pct >= 50) return 'Good effort!'
  return 'Keep practising!'
}

export function ScoreSummary({
  score,
  total,
  color,
  onPlayAgain,
  onChooseMode,
}: {
  score: number
  total: number
  color: string
  onPlayAgain: () => void
  onChooseMode: () => void
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const incorrect = total - score

  return (
    <div className="space-y-6">
      {/* Big score */}
      <div className="rounded-2xl bg-q-card p-6 text-center shadow-card">
        <motion.div
          className="font-display text-7xl font-black tracking-tight"
          style={{ color }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        >
          {score}/{total}
        </motion.div>
        <motion.div
          className="mt-2 text-lg font-semibold text-q-text"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          {messageFor(pct)}
        </motion.div>
        <motion.div
          className="mt-1 text-sm text-q-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          {pct}% correct
        </motion.div>

        {/* Pills */}
        <motion.div
          className="mt-5 flex justify-center gap-3"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: 'rgba(0,212,164,0.15)', color: '#00D4A4' }}
          >
            ✓ {score} correct
          </div>
          <div
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: 'rgba(255,63,94,0.15)', color: '#FF7A94' }}
          >
            ✗ {incorrect} wrong
          </div>
        </motion.div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-xl py-4 font-display text-base font-bold text-black shadow-lift transition hover:brightness-110 active:scale-[0.98] focus:outline-none"
          style={{ backgroundColor: color }}
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        <button
          type="button"
          className="rounded-xl bg-white/10 py-4 font-display text-base font-bold text-q-text shadow-card transition hover:bg-white/16 active:scale-[0.98] focus:outline-none"
          onClick={onChooseMode}
        >
          Choose Mode
        </button>
      </div>
    </div>
  )
}
