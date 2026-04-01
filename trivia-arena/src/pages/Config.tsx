import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuizStore } from '../store/quizStore'

// Candidate tick positions — filtered to what fits in the actual range
const TICK_CANDIDATES = [5, 10, 20, 50, 100, 200]

export function Config() {
  const navigate = useNavigate()
  const status = useQuizStore((s) => s.status)
  const selectedMode = useQuizStore((s) => s.selectedMode)
  const startQuiz = useQuizStore((s) => s.startQuiz)

  const total = selectedMode?.questions.length ?? 0
  const MIN = Math.min(5, total)
  const MAX = total

  const [value, setValue] = useState(Math.min(10, MAX))

  const isAll = value === MAX
  const pct = MAX > MIN ? ((value - MIN) / (MAX - MIN)) * 100 : 100

  // Ticks: candidates within [MIN, MAX), always include MAX.
  // Drop any candidate that is within 8% of the previous kept tick
  // or within 8% of the MAX position, to prevent label collisions.
  const MIN_GAP_PCT = 8
  const rawCandidates = TICK_CANDIDATES.filter((t) => t >= MIN && t < MAX)
  const filteredCandidates: number[] = []
  for (const t of rawCandidates) {
    const tPct = MAX > MIN ? ((t - MIN) / (MAX - MIN)) * 100 : 0
    const prevPct =
      filteredCandidates.length > 0
        ? ((filteredCandidates[filteredCandidates.length - 1] - MIN) / (MAX - MIN)) * 100
        : -Infinity
    if (tPct - prevPct >= MIN_GAP_PCT && 100 - tPct >= MIN_GAP_PCT) {
      filteredCandidates.push(t)
    }
  }
  const ticks = [...filteredCandidates, MAX]

  if (status === 'idle' || !selectedMode) {
    return (
      <div className="text-q-sub">
        No mode selected.{' '}
        <button
          type="button"
          className="text-q-text underline"
          onClick={() => navigate('/')}
        >
          Go back
        </button>
        .
      </div>
    )
  }

  const color = selectedMode.color

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="grid size-14 place-items-center rounded-2xl text-3xl shadow-card"
          style={{ backgroundColor: `${color}28` }}
        >
          {selectedMode.icon}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-q-text">
            {selectedMode.label}
          </h1>
          <p className="text-sm text-q-sub">{total} questions available</p>
        </div>
        <button
          type="button"
          className="ml-auto text-sm text-q-sub transition hover:text-q-text"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
      </div>

      {/* Count picker */}
      <div className="rounded-2xl bg-q-card p-6 shadow-card">
        <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-q-sub">
          How many questions?
        </div>

        {/* Big value display */}
        <div className="mb-6 text-center">
          <motion.div
            key={isAll ? 'all' : value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="font-display text-6xl font-bold"
            style={{ color }}
          >
            {isAll ? 'All' : value}
          </motion.div>
          <div className="mt-1 text-sm text-q-sub">
            {isAll ? `${total} questions` : value === 1 ? '1 question' : `${value} questions`}
          </div>
        </div>

        {/* Slider */}
        <div className="px-2">
          <input
            type="range"
            className="q-range"
            min={MIN}
            max={MAX}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            style={{
              '--range-color': color,
              '--range-glow': `${color}33`,
              '--range-pct': `${pct}%`,
            } as React.CSSProperties}
          />

          {/* Tick marks */}
          <div className="relative mt-3 h-7">
            {ticks.map((tick) => {
              const tickPct = MAX > MIN ? ((tick - MIN) / (MAX - MIN)) * 100 : 100
              const isEnd = tick === MAX
              const isActive = value >= tick
              return (
                <div
                  key={tick}
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${tickPct}%` }}
                >
                  <div
                    className="mb-1 h-1.5 w-0.5 rounded-full transition-colors duration-150"
                    style={{ backgroundColor: isActive ? color : 'rgba(255,255,255,0.15)' }}
                  />
                  <span
                    className="font-mono text-[11px] font-semibold transition-colors duration-150"
                    style={{ color: isActive ? color : '#4A5672' }}
                  >
                    {isEnd ? 'All' : tick}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="w-full rounded-xl py-4 font-display text-lg font-bold text-black shadow-lift transition hover:brightness-110 focus:outline-none active:scale-[0.98]"
        style={{ backgroundColor: color }}
        onClick={() => {
          startQuiz(isAll ? 'all' : value)
          navigate('/quiz')
        }}
      >
        Start Quiz →
      </button>
    </motion.div>
  )
}
