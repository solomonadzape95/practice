import { motion } from 'framer-motion'
import type { Mode } from '../lib/types'

export function ModeCard({ mode, onClick }: { mode: Mode; onClick: () => void }) {
  const isMixed = mode.mode === 'mixed'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-q-card p-5 text-left shadow-card transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-q-purple hover:shadow-lift"
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {/* color glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 20% 20%, ${mode.color}28, transparent 65%)`,
        }}
      />
      {/* hover brighten */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.03]" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div
            className="grid size-12 place-items-center rounded-xl text-2xl"
            style={{ backgroundColor: `${mode.color}22` }}
          >
            {mode.icon}
          </div>
          <div
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${mode.color}18`, color: mode.color }}
          >
            {mode.questions.length} Qs
          </div>
        </div>

        <div>
          <div
            className={[
              'font-display font-bold leading-tight text-q-text',
              isMixed ? 'text-xl' : 'text-lg',
            ].join(' ')}
          >
            {mode.label}
          </div>
          <div className="mt-1 text-sm text-q-sub">
            {isMixed ? 'Questions from all topics' : `${mode.questions.length} questions`}
          </div>
        </div>
      </div>

      {/* right-arrow hint */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ color: mode.color }}
      >
        →
      </div>
    </motion.button>
  )
}
