import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ModeCard } from '../components/ModeCard'
import { useQuizStore } from '../store/quizStore'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export function Home() {
  const navigate = useNavigate()
  const modes = useQuizStore((s) => s.modes)
  const resetQuiz = useQuizStore((s) => s.resetQuiz)
  const selectMode = useQuizStore((s) => s.selectMode)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-q-text">
            Choose a topic
          </h1>
          <p className="mt-2 text-q-sub">Pick a mode and start your quiz in seconds.</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-xl bg-q-card px-4 py-2.5 text-sm font-semibold text-q-sub shadow-card transition hover:bg-q-hover hover:text-q-text active:scale-95 focus:outline-none"
          onClick={() => navigate('/upload')}
        >
          + Upload JSON
        </button>
      </div>

      {modes.length === 0 ? (
        <div className="rounded-2xl bg-q-card p-8 text-center text-q-sub">
          No question modes found. Add JSON files to{' '}
          <code className="text-q-text">src/questions/</code>.
        </div>
      ) : (
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
                  resetQuiz()
                  selectMode(mode)
                  navigate('/config')
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
