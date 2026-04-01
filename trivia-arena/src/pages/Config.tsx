import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuizStore } from '../store/quizStore'

type CountChoice = 5 | 10 | 20 | 'all'

const COUNT_OPTIONS: { value: CountChoice; label: string }[] = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 'all', label: 'All' },
]

export function Config() {
  const navigate = useNavigate()
  const status = useQuizStore((s) => s.status)
  const selectedMode = useQuizStore((s) => s.selectedMode)
  const startQuiz = useQuizStore((s) => s.startQuiz)

  const total = selectedMode?.questions.length ?? 0
  const defaultCount: CountChoice = total >= 10 ? 10 : total >= 5 ? 5 : 'all'
  const [count, setCount] = useState<CountChoice>(defaultCount)

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
          style={{ backgroundColor: `${selectedMode.color}28` }}
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
      <div>
        <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-q-sub">
          How many questions?
        </div>
        <div className="grid grid-cols-4 gap-2">
          {COUNT_OPTIONS.map((opt) => {
            const unavailable =
              typeof opt.value === 'number' && opt.value > total
            const selected = opt.value === count && !unavailable
            return (
              <button
                key={String(opt.value)}
                type="button"
                disabled={unavailable}
                onClick={() => !unavailable && setCount(opt.value)}
                className={[
                  'relative overflow-hidden rounded-xl py-4 text-center transition focus:outline-none',
                  unavailable
                    ? 'cursor-not-allowed opacity-30'
                    : selected
                      ? 'shadow-lift'
                      : 'bg-q-card hover:bg-q-hover',
                ].join(' ')}
                style={
                  selected
                    ? {
                        background: `linear-gradient(135deg, ${selectedMode.color}50, ${selectedMode.color}22)`,
                      }
                    : undefined
                }
              >
                <div
                  className={[
                    'font-display text-2xl font-bold',
                    selected ? 'text-q-text' : 'text-q-sub',
                  ].join(' ')}
                >
                  {opt.label}
                </div>
                {opt.value === 'all' && (
                  <div className={['text-xs mt-0.5', selected ? 'text-q-text/70' : 'text-q-dim'].join(' ')}>
                    {total} total
                  </div>
                )}
                {selected && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{ backgroundColor: selectedMode.color }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="w-full rounded-xl py-4 font-display text-lg font-bold text-black shadow-lift transition hover:brightness-110 focus:outline-none active:scale-[0.98]"
        style={{ backgroundColor: selectedMode.color }}
        onClick={() => {
          startQuiz(count)
          navigate('/quiz')
        }}
      >
        Start Quiz →
      </button>
    </motion.div>
  )
}
