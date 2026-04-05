import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ModeCard } from '../components/ModeCard'
import { OPPONENT_PROFILES, useBuzzerStore } from '../store/buzzerStore'
import { useQuizStore } from '../store/quizStore'
import type { Mode, Opponent } from '../lib/types'

const TICK_CANDIDATES = [5, 10, 20, 50, 100, 200]
const MIN_GAP_PCT = 8

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

export function BuzzerLobby() {
  const navigate = useNavigate()
  const modes = useQuizStore((s) => s.modes)
  const startGame = useBuzzerStore((s) => s.startGame)

  const [step, setStep] = useState<'mode' | 'opponent' | 'count'>('mode')
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  const [opponent, setOpponent] = useState<Opponent>('abayomi')

  const total = selectedMode?.questions.length ?? 0
  const MIN = Math.min(5, total)
  const MAX = total
  const [value, setValue] = useState(Math.min(10, MAX))
  const [inputRaw, setInputRaw] = useState(String(Math.min(10, MAX)))

  const isAll = value === MAX
  const pct = MAX > MIN ? ((value - MIN) / (MAX - MIN)) * 100 : 100

  // tick marks
  const rawCandidates = TICK_CANDIDATES.filter((t) => t >= MIN && t < MAX)
  const filteredCandidates: number[] = []
  for (const t of rawCandidates) {
    const tPct = MAX > MIN ? ((t - MIN) / (MAX - MIN)) * 100 : 0
    const prevPct =
      filteredCandidates.length > 0
        ? ((filteredCandidates[filteredCandidates.length - 1] - MIN) / (MAX - MIN)) * 100
        : -Infinity
    if (tPct - prevPct >= MIN_GAP_PCT && 100 - tPct >= MIN_GAP_PCT) filteredCandidates.push(t)
  }
  const ticks = [...filteredCandidates, MAX]

  const setCount = (n: number) => {
    const clamped = Math.max(MIN, Math.min(MAX, n))
    setValue(clamped)
    setInputRaw(clamped === MAX ? 'All' : String(clamped))
  }

  const handleStart = () => {
    if (!selectedMode) return
    startGame(selectedMode, isAll ? 'all' : value, opponent)
    navigate('/buzzer/game')
  }

  // ── Step: Mode selection ────────────────────────────────────────────────
  if (step === 'mode') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-q-purple">
              Buzzer Mode
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-q-text">
              Pick a subject
            </h1>
            <p className="mt-2 text-q-sub">Questions will be drawn from this topic.</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-sm text-q-sub transition hover:text-q-text"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
        </div>
        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {modes.map((mode) => (
            <motion.div key={mode.mode} variants={item}>
              <ModeCard
                mode={mode}
                onClick={() => {
                  setSelectedMode(mode)
                  const newMax = mode.questions.length
                  const v = Math.min(10, newMax)
                  setValue(v)
                  setInputRaw(String(v))
                  setStep('opponent')
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    )
  }

  // ── Step: Opponent selection ───────────────────────────────────────────
  if (step === 'opponent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-q-purple">
              Buzzer Mode
            </div>
            <h1 className="font-display text-3xl font-bold text-q-text">Choose your opponent</h1>
          </div>
          <button
            type="button"
            className="text-sm text-q-sub transition hover:text-q-text"
            onClick={() => setStep('mode')}
          >
            ← Back
          </button>
        </div>

        <div className="space-y-3">
          {(Object.keys(OPPONENT_PROFILES) as Opponent[]).map((key) => {
            const p = OPPONENT_PROFILES[key]
            const selected = opponent === key
            const diffColor =
              key === 'solomon' ? '#00D4A4' : key === 'abayomi' ? '#F59E0B' : '#FF3F5E'
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => setOpponent(key)}
                className="group relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all focus:outline-none"
                style={
                  selected
                    ? { backgroundColor: '#1C2235', boxShadow: `0 0 0 2px ${diffColor}` }
                    : { backgroundColor: '#141826' }
                }
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-xl text-2xl font-bold"
                    style={{ backgroundColor: `${diffColor}22`, color: diffColor }}
                  >
                    {key === 'solomon' ? '🟢' : key === 'abayomi' ? '🟡' : '🔴'}
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg font-bold text-q-text">{p.label}</div>
                    <div className="mt-0.5 text-sm text-q-sub">{p.description}</div>
                  </div>
                  <div className="space-y-1 text-right text-xs text-q-dim">
                    <div>Buzz: {p.buzzMin / 1000}–{p.buzzMax / 1000}s</div>
                    <div>Accuracy: {Math.round(p.accuracy * 100)}%</div>
                  </div>
                </div>
                {selected && (
                  <div
                    className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: diffColor }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        <button
          type="button"
          className="w-full rounded-xl py-4 font-display text-lg font-bold text-black shadow-lift transition hover:brightness-110 focus:outline-none active:scale-[0.98]"
          style={{ backgroundColor: '#A78BFA' }}
          onClick={() => setStep('count')}
        >
          Continue →
        </button>
      </motion.div>
    )
  }

  // ── Step: Question count ───────────────────────────────────────────────
  const color = selectedMode?.color ?? '#A78BFA'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-q-purple">
            Buzzer Mode
          </div>
          <h1 className="font-display text-3xl font-bold text-q-text">How many questions?</h1>
          <p className="mt-1 text-sm text-q-sub">
            {selectedMode?.label} · vs {OPPONENT_PROFILES[opponent].label}
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-q-sub transition hover:text-q-text"
          onClick={() => setStep('opponent')}
        >
          ← Back
        </button>
      </div>

      <div className="rounded-2xl bg-q-card p-6 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-2">
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
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN}
              max={MAX}
              value={inputRaw === 'All' ? MAX : inputRaw}
              onChange={(e) => {
                setInputRaw(e.target.value)
                const n = parseInt(e.target.value, 10)
                if (!isNaN(n)) setValue(Math.max(MIN, Math.min(MAX, n)))
              }}
              onBlur={() => setCount(parseInt(inputRaw, 10) || value)}
              onFocus={(e) => e.target.select()}
              className="w-24 rounded-xl bg-q-hover px-3 py-1.5 text-center font-mono text-sm text-q-text outline-none ring-1 ring-white/10 transition focus:ring-2"
              style={{ '--tw-ring-color': color } as React.CSSProperties}
            />
            <span className="text-sm text-q-dim">/ {total}</span>
          </div>
        </div>

        <div className="px-2">
          <input
            type="range"
            className="q-range"
            min={MIN}
            max={MAX}
            value={value}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{
              '--range-color': color,
              '--range-glow': `${color}33`,
              '--range-pct': `${pct}%`,
            } as React.CSSProperties}
          />
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

      <button
        type="button"
        className="w-full rounded-xl py-4 font-display text-lg font-bold text-black shadow-lift transition hover:brightness-110 focus:outline-none active:scale-[0.98]"
        style={{ backgroundColor: color }}
        onClick={handleStart}
      >
        Start Game →
      </button>
    </motion.div>
  )
}
