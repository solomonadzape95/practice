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

      {/* Buzzer Mode banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        <div
          role="button"
          tabIndex={0}
          className="group relative w-full cursor-pointer overflow-hidden rounded-2xl p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-q-purple hover:shadow-lift"
          style={{ backgroundColor: '#1C1A2E' }}
          onClick={() => navigate('/buzzer')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/buzzer')}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 70% at 10% 50%, rgba(167,139,250,0.18), transparent 60%)',
            }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className="grid size-12 shrink-0 place-items-center rounded-xl text-2xl"
              style={{ backgroundColor: 'rgba(167,139,250,0.15)' }}
            >
              🔔
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold text-q-text">Buzzer Mode</div>
              <div className="mt-0.5 text-sm text-q-sub">
                Race an AI opponent to buzz in and answer first
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs font-bold text-q-sub transition hover:text-q-text focus:outline-none"
                onClick={(e) => { e.stopPropagation(); navigate('/buzzer/stats') }}
              >
                Stats
              </button>
              <span className="text-q-purple opacity-0 transition-opacity group-hover:opacity-100">→</span>
            </div>
          </div>
        </div>
      </motion.div>

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
