import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { OPPONENT_PROFILES, useBuzzerStore } from '../store/buzzerStore'
import { useQuizStore } from '../store/quizStore'
import { mergeGameRounds } from '../lib/buzzerStats'

export function BuzzerResults() {
  const navigate = useNavigate()
  const status = useBuzzerStore((s) => s.status)
  const rounds = useBuzzerStore((s) => s.rounds)
  const humanScore = useBuzzerStore((s) => s.humanScore)
  const aiScore = useBuzzerStore((s) => s.aiScore)
  const opponent = useBuzzerStore((s) => s.opponent)
  const selectedMode = useBuzzerStore((s) => s.selectedMode)
  const resetGame = useBuzzerStore((s) => s.resetGame)
  const startGame = useBuzzerStore((s) => s.startGame)
  const modes = useQuizStore((s) => s.modes)
  const savedRef = useRef(false)

  const profile = OPPONENT_PROFILES[opponent]
  const color = selectedMode?.color ?? '#A78BFA'
  const total = rounds.length
  const humanWon = humanScore > aiScore
  const draw = humanScore === aiScore

  useEffect(() => {
    if (status !== 'results') { navigate('/buzzer', { replace: true }); return }
    if (savedRef.current) return
    savedRef.current = true
    const labelMap: Record<string, string> = {}
    for (const m of modes) labelMap[m.mode] = m.label
    mergeGameRounds(rounds, opponent, humanScore, aiScore, labelMap)
  }, [status, rounds, opponent, humanScore, aiScore, modes, navigate])

  if (status !== 'results' || !selectedMode) return null

  const humanBuzzed = rounds.filter((r) => r.buzzWinner === 'human').length
  const aiBuzzed = rounds.filter((r) => r.buzzWinner === 'ai').length
  const humanCorrect = rounds.filter((r) => r.buzzWinner === 'human' && r.correct).length
  const aiCorrect = rounds.filter((r) => r.buzzWinner === 'ai' && r.correct).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Score banner */}
      <div className="rounded-2xl bg-q-card p-6 text-center shadow-card">
        <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-q-sub">
          {draw ? "It's a draw!" : humanWon ? 'You win! 🎉' : `${profile.label} wins`}
        </div>
        <div className="flex items-center justify-center gap-6 my-4">
          <div className="text-center">
            <div className="font-display text-5xl font-black text-q-text">{humanScore}</div>
            <div className="mt-1 text-sm text-q-sub">You</div>
          </div>
          <div className="font-display text-2xl text-q-dim">—</div>
          <div className="text-center">
            <div className="font-display text-5xl font-black text-q-text">{aiScore}</div>
            <div className="mt-1 text-sm text-q-sub">{profile.label}</div>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <StatPill label="Your buzzes" value={humanBuzzed} total={total} color={color} />
          <StatPill label="Your correct" value={humanCorrect} total={humanBuzzed} color="#00D4A4" />
          <StatPill label="AI buzzes" value={aiBuzzed} total={total} color="#8494B4" />
          <StatPill label="AI correct" value={aiCorrect} total={aiBuzzed} color="#FF7A94" />
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold text-q-text">Question Breakdown</h2>
        {rounds.map((r, i) => {
          const buzzedByHuman = r.buzzWinner === 'human'
          const buzzedByAi = r.buzzWinner === 'ai'
          const correct = r.correct === true
          const timedOut = r.timedOut

          const cardColor = correct
            ? 'rgba(0,212,164,0.07)'
            : timedOut
              ? 'rgba(245,158,11,0.07)'
              : 'rgba(255,63,94,0.07)'

          const badgeColor = correct ? '#00D4A4' : timedOut ? '#F59E0B' : '#FF3F5E'
          const badgeText = correct ? '✓ Correct' : timedOut ? '⏱ Timeout' : '✗ Wrong'

          return (
            <div
              key={i}
              className="rounded-2xl p-4 shadow-card"
              style={{ backgroundColor: cardColor }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-q-dim uppercase tracking-wider mb-1">
                    Q{i + 1} · {r.modeSlug.replace(/_/g, ' ')}
                  </div>
                  <p className="font-display text-base font-semibold text-q-text leading-snug">
                    {r.question}
                  </p>
                </div>
                <div
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                  style={{ backgroundColor: `${badgeColor}22`, color: badgeColor }}
                >
                  {badgeText}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <div
                  className="rounded-lg px-2.5 py-1 font-semibold"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  Buzzed: {buzzedByHuman ? 'You' : buzzedByAi ? profile.label : 'None'}
                </div>
                <div
                  className="rounded-lg px-2.5 py-1 font-semibold"
                  style={{ backgroundColor: 'rgba(0,212,164,0.1)', color: '#00D4A4' }}
                >
                  Correct: {r.options[r.correctIndex]}
                </div>
                {r.humanAnswerIndex !== null && r.humanAnswerIndex !== r.correctIndex && (
                  <div
                    className="rounded-lg px-2.5 py-1 font-semibold"
                    style={{ backgroundColor: 'rgba(255,63,94,0.1)', color: '#FF7A94' }}
                  >
                    Your answer: {r.options[r.humanAnswerIndex]}
                  </div>
                )}
                {r.aiAnswerIndex !== null && r.aiAnswerIndex !== r.correctIndex && (
                  <div
                    className="rounded-lg px-2.5 py-1 font-semibold"
                    style={{ backgroundColor: 'rgba(255,63,94,0.1)', color: '#FF7A94' }}
                  >
                    {profile.label}'s answer: {r.options[r.aiAnswerIndex]}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-xl py-3.5 font-display text-sm font-bold text-black shadow-lift transition hover:brightness-110 active:scale-[0.98] focus:outline-none"
          style={{ backgroundColor: color }}
          onClick={() => {
            if (!selectedMode) return
            startGame(selectedMode, rounds.length, opponent)
            navigate('/buzzer/game')
          }}
        >
          Play Again
        </button>
        <button
          type="button"
          className="rounded-xl bg-white/8 py-3.5 font-display text-sm font-bold text-q-text shadow-card transition hover:bg-white/12 active:scale-[0.98] focus:outline-none"
          onClick={() => { resetGame(); navigate('/buzzer') }}
        >
          Change Setup
        </button>
        <button
          type="button"
          className="rounded-xl bg-white/8 py-3.5 font-display text-sm font-bold text-q-text shadow-card transition hover:bg-white/12 active:scale-[0.98] focus:outline-none"
          onClick={() => navigate('/buzzer/stats')}
        >
          View Stats
        </button>
        <button
          type="button"
          className="rounded-xl bg-white/8 py-3.5 font-display text-sm font-bold text-q-text shadow-card transition hover:bg-white/12 active:scale-[0.98] focus:outline-none"
          onClick={() => { resetGame(); navigate('/') }}
        >
          Home
        </button>
      </div>
    </motion.div>
  )
}

function StatPill({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div
      className="rounded-xl px-3 py-2 text-center"
      style={{ backgroundColor: `${color}14` }}
    >
      <div className="font-display text-lg font-bold" style={{ color }}>
        {value}
        <span className="ml-1 text-xs font-normal text-q-dim">/{total}</span>
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-q-dim">{label}</div>
      <div className="text-xs font-bold" style={{ color }}>{pct}%</div>
    </div>
  )
}
