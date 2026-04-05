import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TimerBar } from '../components/TimerBar'
import { useQuestionTimer } from '../hooks/useQuestionTimer'
import { OPPONENT_PROFILES, useBuzzerStore } from '../store/buzzerStore'

const ANSWER_SECONDS = 5
const INTER_QUESTION_DELAY = 3

const LETTER_KEYS = ['a', 'b', 'c', 'd', 'e', 'f']

export function BuzzerGame() {
  const navigate = useNavigate()

  const status = useBuzzerStore((s) => s.status)
  const selectedMode = useBuzzerStore((s) => s.selectedMode)
  const questions = useBuzzerStore((s) => s.questions)
  const currentIndex = useBuzzerStore((s) => s.currentIndex)
  const phase = useBuzzerStore((s) => s.phase)
  const humanScore = useBuzzerStore((s) => s.humanScore)
  const aiScore = useBuzzerStore((s) => s.aiScore)
  const opponent = useBuzzerStore((s) => s.opponent)
  const aiBuzzDelayMs = useBuzzerStore((s) => s.aiBuzzDelayMs)
  const humanBuzz = useBuzzerStore((s) => s.humanBuzz)
  const humanAnswer = useBuzzerStore((s) => s.humanAnswer)
  const humanTimeout = useBuzzerStore((s) => s.humanTimeout)
  const advanceQuestion = useBuzzerStore((s) => s.advanceQuestion)
  const resetGame = useBuzzerStore((s) => s.resetGame)

  const [isPaused, setIsPaused] = useState(false)
  const [delayLeft, setDelayLeft] = useState<number | null>(null)

  const aiBuzzTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const q = questions[currentIndex]
  const color = selectedMode?.color ?? '#A78BFA'
  const profile = OPPONENT_PROFILES[opponent]
  const inDelay = delayLeft !== null

  // Navigate away when not in an active game
  useEffect(() => {
    if (status === 'idle') navigate('/buzzer', { replace: true })
    if (status === 'results') navigate('/buzzer/results', { replace: true })
  }, [status, navigate])

  // Reset delay on new question
  useEffect(() => {
    setDelayLeft(null)
    if (delayIntervalRef.current) clearInterval(delayIntervalRef.current)
  }, [currentIndex])

  // Schedule AI buzz when phase is 'waiting'
  useEffect(() => {
    if (phase !== 'waiting' || isPaused) return
    if (aiBuzzTimerRef.current) clearTimeout(aiBuzzTimerRef.current)

    aiBuzzTimerRef.current = setTimeout(() => {
      const currentPhase = useBuzzerStore.getState().phase
      if (currentPhase !== 'waiting') return
      // AI buzzes — show 1–2s "thinking" then reveal answer
      useBuzzerStore.getState().aiBuzz()
    }, aiBuzzDelayMs)

    return () => {
      if (aiBuzzTimerRef.current) clearTimeout(aiBuzzTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex])

  // When AI buzzes in, show a "thinking" animation before revealing the answer
  useEffect(() => {
    if (phase !== 'post_answer') return
    // Check if the AI buzzed for this round
    const rounds = useBuzzerStore.getState().rounds
    const lastRound = rounds[rounds.length - 1]
    if (!lastRound || lastRound.buzzWinner !== 'ai') return
    // Already in post_answer — start delay immediately
    startDelay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Watch for phase change to post_answer from human answer/timeout
  useEffect(() => {
    if (phase !== 'post_answer') return
    const rounds = useBuzzerStore.getState().rounds
    const lastRound = rounds[rounds.length - 1]
    if (lastRound?.buzzWinner === 'human') startDelay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function startDelay() {
    setDelayLeft(INTER_QUESTION_DELAY)
    if (delayIntervalRef.current) clearInterval(delayIntervalRef.current)
    delayIntervalRef.current = setInterval(() => {
      setDelayLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(delayIntervalRef.current!)
          advanceQuestion()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  // Pause/resume delay interval
  useEffect(() => {
    if (delayLeft === null) return
    if (isPaused) {
      clearInterval(delayIntervalRef.current!)
    } else {
      delayIntervalRef.current = setInterval(() => {
        setDelayLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(delayIntervalRef.current!)
            advanceQuestion()
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(delayIntervalRef.current!)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused])

  // Spacebar: buzz (when waiting) or pause (when answering/delay)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return
      if (status !== 'active') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (phase === 'waiting' && !isPaused) {
          if (aiBuzzTimerRef.current) clearTimeout(aiBuzzTimerRef.current)
          humanBuzz()
        } else {
          setIsPaused((p) => !p)
        }
        return
      }

      // Letter keys A–F to answer when human buzzed
      if (phase === 'buzzed_human' && !isPaused && q) {
        const idx = LETTER_KEYS.indexOf(e.key.toLowerCase())
        if (idx >= 0 && idx < q.options.length) {
          humanAnswer(idx)
          startDelay()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isPaused, status, q])

  // Answer timer (only when human buzzed)
  const { pct: answerPct } = useQuestionTimer({
    duration: ANSWER_SECONDS,
    questionKey: `${currentIndex}-human`,
    isPaused,
    isStopped: phase !== 'buzzed_human',
    onExpire: () => {
      humanTimeout()
      startDelay()
    },
  })

  if (!q || status !== 'active') return null

  const lastRound = useBuzzerStore.getState().rounds[useBuzzerStore.getState().rounds.length - 1]
  const showResult = phase === 'post_answer' && lastRound
  const resultCorrect = showResult && lastRound.correct === true
  const resultTimedOut = showResult && lastRound.timedOut
  const aiBuzzedLast = showResult && lastRound.buzzWinner === 'ai'
  const humanBuzzedLast = showResult && lastRound.buzzWinner === 'human'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 pb-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-2 rounded-xl bg-q-card px-4 py-2 shadow-card">
            <span className="font-display text-lg font-bold text-q-text">{humanScore}</span>
            <span className="text-q-dim">–</span>
            <span className="font-display text-lg font-bold text-q-text">{aiScore}</span>
          </div>

          {/* Progress */}
          <div className="flex-1 text-center text-xs font-semibold text-q-sub">
            Q {currentIndex + 1} / {questions.length}
          </div>

          {/* Opponent badge */}
          <div
            className="rounded-xl px-3 py-2 text-xs font-bold"
            style={{ backgroundColor: `${color}18`, color }}
          >
            vs {profile.label}
          </div>

          {/* Pause */}
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-sm transition focus:outline-none"
            style={{ backgroundColor: `${color}22`, color }}
            onClick={() => setIsPaused((p) => !p)}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>

        {/* Paused banner */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between rounded-xl px-4 py-2.5"
              style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33` }}
            >
              <span className="text-sm font-semibold" style={{ color }}>
                ⏸ Paused
              </span>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs font-bold text-black transition hover:brightness-110 focus:outline-none"
                style={{ backgroundColor: color }}
                onClick={() => setIsPaused(false)}
              >
                Resume
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <div className="min-h-[120px] rounded-2xl bg-q-card p-6 text-center shadow-card">
              <p className="font-display text-2xl font-bold leading-snug text-q-text sm:text-3xl">
                {q.question}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Options — shown always so user can read; clickable only when human buzzed */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((opt, idx) => {
            const canClick = phase === 'buzzed_human' && !isPaused
            let bg = 'rgba(255,255,255,0.04)'
            let border = 'transparent'
            let textColor = '#8494B4'

            if (phase === 'post_answer' && showResult) {
              if (idx === q.correct_index) {
                bg = 'rgba(0,212,164,0.14)'
                border = 'rgba(0,212,164,0.4)'
                textColor = '#00D4A4'
              } else if (
                idx === lastRound.humanAnswerIndex ||
                idx === lastRound.aiAnswerIndex
              ) {
                bg = 'rgba(255,63,94,0.14)'
                border = 'rgba(255,63,94,0.4)'
                textColor = '#FF7A94'
              }
            } else if (phase === 'buzzed_human' && !isPaused) {
              bg = '#141826'
              textColor = '#F0F4FF'
              border = 'rgba(255,255,255,0.08)'
            }

            return (
              <motion.button
                key={idx}
                type="button"
                disabled={!canClick}
                onClick={() => {
                  if (!canClick) return
                  humanAnswer(idx)
                  startDelay()
                }}
                className="flex items-center gap-3 rounded-xl p-4 text-left transition-all focus:outline-none"
                style={{
                  backgroundColor: bg,
                  boxShadow: `0 0 0 1.5px ${border}`,
                  cursor: canClick ? 'pointer' : 'default',
                }}
                whileHover={canClick ? { scale: 1.01 } : undefined}
                whileTap={canClick ? { scale: 0.97 } : undefined}
              >
                <div
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: textColor }}
                >
                  {LETTER_KEYS[idx]?.toUpperCase()}
                </div>
                <span className="text-base font-medium leading-snug" style={{ color: textColor }}>
                  {opt}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Buzzer area */}
        <AnimatePresence mode="wait">
          {phase === 'waiting' && !isPaused && (
            <motion.div
              key="buzzer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.button
                type="button"
                className="rounded-2xl px-12 py-5 font-display text-2xl font-black text-black shadow-lift transition hover:brightness-110 active:scale-95 focus:outline-none"
                style={{ backgroundColor: color }}
                onClick={() => {
                  if (aiBuzzTimerRef.current) clearTimeout(aiBuzzTimerRef.current)
                  humanBuzz()
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                BUZZ!
              </motion.button>
              <p className="text-xs text-q-dim">or press Space</p>
            </motion.div>
          )}

          {phase === 'buzzed_human' && !isPaused && (
            <motion.div
              key="answering"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 text-center"
              style={{ backgroundColor: `${color}14`, border: `1px solid ${color}33` }}
            >
              <div className="font-display text-base font-bold" style={{ color }}>
                You buzzed in! Pick an answer
              </div>
              <div className="mt-1 text-xs text-q-sub">Click an option or press A–D</div>
            </motion.div>
          )}

          {phase === 'buzzed_ai' && (
            <motion.div
              key="ai-thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 text-center"
              style={{ backgroundColor: '#1C2235' }}
            >
              <div className="font-display text-base font-bold text-q-sub">
                {profile.label} buzzed in…
              </div>
              <motion.div
                className="mt-2 flex justify-center gap-1"
                initial="start"
                animate="end"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-q-dim"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {phase === 'post_answer' && showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 text-center"
              style={
                resultCorrect
                  ? { backgroundColor: 'rgba(0,212,164,0.1)', border: '1px solid rgba(0,212,164,0.3)' }
                  : { backgroundColor: 'rgba(255,63,94,0.1)', border: '1px solid rgba(255,63,94,0.3)' }
              }
            >
              <div
                className="font-display text-lg font-bold"
                style={{ color: resultCorrect ? '#00D4A4' : '#FF3F5E' }}
              >
                {resultCorrect
                  ? `${aiBuzzedLast ? profile.label : 'You'} got it right! ✓`
                  : resultTimedOut
                    ? `${humanBuzzedLast ? 'You' : profile.label} ran out of time ⏱`
                    : `${aiBuzzedLast ? profile.label : 'You'} got it wrong ✗`}
              </div>
              <div className="mt-1 text-xs text-q-sub">
                Score: You {humanScore} — {profile.label} {aiScore}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delay countdown */}
        <AnimatePresence>
          {inDelay && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4"
            >
              <div className="text-sm text-q-sub">
                Next question in{' '}
                <span className="font-bold tabular-nums" style={{ color }}>
                  {delayLeft}s
                </span>
              </div>
              <div className="flex-1 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full transition-[width] duration-1000"
                  style={{
                    backgroundColor: color,
                    width: `${((delayLeft ?? 0) / INTER_QUESTION_DELAY) * 100}%`,
                  }}
                />
              </div>
              <button
                type="button"
                className="rounded-xl px-4 py-2 font-display text-sm font-bold text-black shadow-lift transition hover:brightness-110 active:scale-[0.98] focus:outline-none"
                style={{ backgroundColor: color }}
                onClick={() => {
                  clearInterval(delayIntervalRef.current!)
                  setDelayLeft(null)
                  advanceQuestion()
                }}
              >
                Skip →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quit link */}
        <div className="text-center">
          <button
            type="button"
            className="text-xs text-q-dim transition hover:text-q-sub focus:outline-none"
            onClick={() => {
              resetGame()
              navigate('/buzzer')
            }}
          >
            Quit game
          </button>
        </div>
      </motion.div>

      {/* Answer countdown timer bar */}
      <TimerBar
        pct={answerPct}
        color={color}
        hidden={phase !== 'buzzed_human' || isPaused}
      />
    </>
  )
}
