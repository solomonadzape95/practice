import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '../components/ProgressBar'
import { QuestionCard } from '../components/QuestionCard'
import { useQuizStore } from '../store/quizStore'

export function Quiz() {
  const navigate = useNavigate()
  const status = useQuizStore((s) => s.status)
  const selectedMode = useQuizStore((s) => s.selectedMode)
  const questions = useQuizStore((s) => s.questions)
  const currentIndex = useQuizStore((s) => s.currentIndex)
  const answers = useQuizStore((s) => s.answers)
  const answerQuestion = useQuizStore((s) => s.answerQuestion)
  const nextQuestion = useQuizStore((s) => s.nextQuestion)

  useEffect(() => {
    if (status === 'results') navigate('/results', { replace: true })
  }, [navigate, status])

  useEffect(() => {
    if (status === 'idle') navigate('/', { replace: true })
    if (status === 'configuring') navigate('/config', { replace: true })
  }, [navigate, status])

  if (status !== 'active' || !selectedMode) return null

  const q = questions[currentIndex]
  if (!q) return null

  const selectedIndex = answers[currentIndex]
  const answered = selectedIndex !== null
  const isLast = currentIndex === questions.length - 1
  const color = selectedMode.color

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <div
          className="grid size-8 place-items-center rounded-lg text-base"
          style={{ backgroundColor: `${color}22` }}
        >
          {selectedMode.icon}
        </div>
        <div className="flex-1">
          <ProgressBar
            current={currentIndex + 1}
            total={questions.length}
            color={color}
          />
        </div>
      </div>

      {/* Question + options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          <QuestionCard
            question={q}
            selectedIndex={selectedIndex}
            onSelect={(idx) => answerQuestion(idx)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Continue / hint */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-q-dim">
          {answered ? null : 'Select an answer'}
        </div>
        <AnimatePresence>
          {answered && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl px-6 py-3 font-display text-base font-bold text-black shadow-lift transition hover:brightness-110 active:scale-[0.98] focus:outline-none"
              style={{ backgroundColor: color }}
              onClick={() => nextQuestion()}
            >
              {isLast ? 'See Results →' : 'Continue →'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
