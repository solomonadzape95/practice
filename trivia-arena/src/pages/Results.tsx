import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ReviewItem } from '../components/ReviewItem'
import { ScoreSummary } from '../components/ScoreSummary'
import { useQuizStore } from '../store/quizStore'

export function Results() {
  const navigate = useNavigate()
  const status = useQuizStore((s) => s.status)
  const selectedMode = useQuizStore((s) => s.selectedMode)
  const questions = useQuizStore((s) => s.questions)
  const answers = useQuizStore((s) => s.answers)
  const score = useQuizStore((s) => s.score)
  const selectMode = useQuizStore((s) => s.selectMode)
  const resetQuiz = useQuizStore((s) => s.resetQuiz)

  const [showCorrect, setShowCorrect] = useState(false)

  const { incorrect, correct } = useMemo(() => {
    const inc: number[] = []
    const cor: number[] = []
    for (let i = 0; i < questions.length; i++) {
      const a = answers[i] ?? null
      if (a !== null && a === questions[i]?.correct_index) cor.push(i)
      else inc.push(i)
    }
    return { incorrect: inc, correct: cor }
  }, [answers, questions])

  if (status !== 'results' || !selectedMode) {
    return (
      <div className="text-q-sub">
        No results.{' '}
        <button type="button" className="text-q-text underline" onClick={() => navigate('/')}>
          Go home
        </button>
      </div>
    )
  }

  const color = selectedMode.color

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Score */}
      <ScoreSummary
        score={score}
        total={questions.length}
        color={color}
        onPlayAgain={() => {
          selectMode(selectedMode)
          navigate('/config')
        }}
        onChooseMode={() => {
          resetQuiz()
          navigate('/')
        }}
      />

      {/* Review */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-q-text">Answer Review</h2>

        {/* Incorrect */}
        {incorrect.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-q-red uppercase tracking-wider">
              ✗ Incorrect — {incorrect.length}
            </div>
            {incorrect.map((qIdx) => (
              <ReviewItem
                key={questions[qIdx]?.id ?? qIdx}
                question={questions[qIdx]}
                selectedIndex={answers[qIdx] ?? null}
              />
            ))}
          </div>
        )}

        {/* Correct */}
        {correct.length > 0 && (
          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-semibold text-q-green uppercase tracking-wider focus:outline-none"
              onClick={() => setShowCorrect((v) => !v)}
            >
              <span>✓ Correct — {correct.length}</span>
              <span className="text-xs text-q-dim normal-case tracking-normal">
                {showCorrect ? 'Collapse ↑' : 'Expand ↓'}
              </span>
            </button>
            {showCorrect && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                {correct.map((qIdx) => (
                  <ReviewItem
                    key={questions[qIdx]?.id ?? qIdx}
                    question={questions[qIdx]}
                    selectedIndex={answers[qIdx] ?? null}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {incorrect.length === 0 && (
          <div className="rounded-2xl bg-q-card p-6 text-center text-q-green font-semibold shadow-card">
            You got everything right. Impressive!
          </div>
        )}
      </div>
    </motion.div>
  )
}
