import { useEffect, useRef, useState } from 'react'

interface UseQuestionTimerOptions {
  /** Total seconds for the question. 0 disables the timer. */
  duration: number
  /** Changes to this value reset the timer (pass the question ID). */
  questionKey: string
  /** When true the timer is frozen. */
  isPaused: boolean
  /** When true the timer is stopped (question already answered / in delay). */
  isStopped: boolean
  /** Called once when the timer reaches zero. */
  onExpire: () => void
}

interface UseQuestionTimerResult {
  /** Remaining milliseconds */
  timeLeftMs: number
  /** 0 → 1 fraction of time remaining (1 = full, 0 = expired) */
  pct: number
}

const TICK_MS = 50

export function useQuestionTimer({
  duration,
  questionKey,
  isPaused,
  isStopped,
  onExpire,
}: UseQuestionTimerOptions): UseQuestionTimerResult {
  const totalMs = duration * 1000
  const [timeLeftMs, setTimeLeftMs] = useState(totalMs)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  // Reset whenever the question changes
  useEffect(() => {
    if (duration === 0) return
    setTimeLeftMs(totalMs)
    expiredRef.current = false
  }, [questionKey, totalMs, duration])

  // Tick interval
  useEffect(() => {
    if (duration === 0 || isPaused || isStopped) return

    const id = setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = prev - TICK_MS
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true
          // Fire expire callback outside of setState
          setTimeout(() => onExpireRef.current(), 0)
          return 0
        }
        return Math.max(next, 0)
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, [duration, isPaused, isStopped, questionKey])

  const pct = totalMs > 0 ? timeLeftMs / totalMs : 1

  return { timeLeftMs, pct }
}
