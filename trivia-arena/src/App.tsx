import { Navigate, Route, Routes } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Config } from './pages/Config'
import { Home } from './pages/Home'
import { Quiz } from './pages/Quiz'
import { Results } from './pages/Results'
import { Upload } from './pages/Upload'
import { BuzzerLobby } from './pages/BuzzerLobby'
import { BuzzerGame } from './pages/BuzzerGame'
import { BuzzerResults } from './pages/BuzzerResults'
import { BuzzerStats } from './pages/BuzzerStats'

function App() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8">
        <motion.header
          className="mb-10 flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <a href="/" className="font-display text-xl font-bold tracking-widest text-q-text uppercase hover:underline transition-colors">
            TriviaArena
          </a>
        </motion.header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/config" element={<Config />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/results" element={<Results />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/buzzer" element={<BuzzerLobby />} />
            <Route path="/buzzer/game" element={<BuzzerGame />} />
            <Route path="/buzzer/results" element={<BuzzerResults />} />
            <Route path="/buzzer/stats" element={<BuzzerStats />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
