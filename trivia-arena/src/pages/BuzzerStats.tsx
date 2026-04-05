import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  exportStatsAsJSON,
  importStatsFromJSON,
  loadStats,
  resetStats,
} from '../lib/buzzerStats'
import { OPPONENT_PROFILES } from '../store/buzzerStore'
import type { Opponent } from '../lib/types'

function pct(num: number, den: number) {
  if (den === 0) return '—'
  return `${Math.round((num / den) * 100)}%`
}

const DIFF_COLOR: Record<Opponent, string> = {
  solomon: '#00D4A4',
  abayomi: '#F59E0B',
  quayum: '#FF3F5E',
}

export function BuzzerStats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(() => loadStats())
  const [confirmReset, setConfirmReset] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = () => setStats(loadStats())

  const handleImport = async (file: File) => {
    setImportError(null)
    setImportSuccess(false)
    try {
      await importStatsFromJSON(file)
      refresh()
      setImportSuccess(true)
    } catch (e) {
      setImportError((e as Error).message)
    }
  }

  const opponents = Object.keys(OPPONENT_PROFILES) as Opponent[]
  const subjects = Object.entries(stats.bySubject)

  const hasData = opponents.some((o) => stats.byOpponent[o].gamesPlayed > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-q-purple">
            Buzzer Mode
          </div>
          <h1 className="font-display text-3xl font-bold text-q-text">Your Stats</h1>
          {stats.lastUpdated && (
            <p className="mt-1 text-xs text-q-dim">
              Last updated {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          className="text-sm text-q-sub transition hover:text-q-text"
          onClick={() => navigate('/buzzer')}
        >
          ← Back
        </button>
      </div>

      {!hasData && (
        <div className="rounded-2xl bg-q-card p-8 text-center text-q-sub shadow-card">
          No games played yet. Start a Buzzer game to build your stats.
        </div>
      )}

      {/* Per-opponent record */}
      {hasData && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-q-text">Record by Opponent</h2>
          {opponents.map((key) => {
            const o = stats.byOpponent[key]
            if (o.gamesPlayed === 0) return null
            const color = DIFF_COLOR[key]
            const profile = OPPONENT_PROFILES[key]
            const winRate = pct(o.humanWins, o.gamesPlayed)
            return (
              <div key={key} className="rounded-2xl bg-q-card p-5 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="grid size-10 place-items-center rounded-xl text-xl"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    {key === 'solomon' ? '🟢' : key === 'abayomi' ? '🟡' : '🔴'}
                  </div>
                  <div>
                    <div className="font-display font-bold text-q-text">{profile.label}</div>
                    <div className="text-xs text-q-sub">{o.gamesPlayed} games played</div>
                  </div>
                  <div
                    className="ml-auto font-display text-2xl font-black"
                    style={{ color }}
                  >
                    {winRate} wins
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <RecordCell label="Wins" value={o.humanWins} color="#00D4A4" />
                  <RecordCell label="Losses" value={o.aiWins} color="#FF3F5E" />
                  <RecordCell label="Draws" value={o.draws} color="#8494B4" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs text-q-dim uppercase tracking-wider mb-2">You</div>
                    <div className="text-sm text-q-sub">
                      Buzzed: <span className="font-bold text-q-text">{o.humanBuzzed}</span>
                    </div>
                    <div className="text-sm text-q-sub">
                      Correct: <span className="font-bold text-q-text">{o.humanCorrect}</span>{' '}
                      <span className="text-q-dim">({pct(o.humanCorrect, o.humanBuzzed)})</span>
                    </div>
                    <div className="text-sm text-q-sub">
                      Timed out: <span className="font-bold text-q-text">{o.humanTimedOut}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs text-q-dim uppercase tracking-wider mb-2">
                      {profile.label}
                    </div>
                    <div className="text-sm text-q-sub">
                      Buzzed: <span className="font-bold text-q-text">{o.aiBuzzed}</span>
                    </div>
                    <div className="text-sm text-q-sub">
                      Correct: <span className="font-bold text-q-text">{o.aiCorrect}</span>{' '}
                      <span className="text-q-dim">({pct(o.aiCorrect, o.aiBuzzed)})</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-q-text">By Subject</h2>
          <div className="rounded-2xl bg-q-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-q-dim">
                    Subject
                  </th>
                  <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-q-dim">
                    Your buzz
                  </th>
                  <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-q-dim">
                    Your acc.
                  </th>
                  <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-q-dim">
                    AI buzz
                  </th>
                  <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-q-dim">
                    AI acc.
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(([slug, s]) => (
                  <tr key={slug} className="border-b border-white/5 last:border-0">
                    <td className="p-3 font-semibold text-q-text">{s.label}</td>
                    <td className="p-3 text-center text-q-sub">{s.humanBuzzed}</td>
                    <td
                      className="p-3 text-center font-bold"
                      style={{ color: '#00D4A4' }}
                    >
                      {pct(s.humanCorrect, s.humanBuzzed)}
                    </td>
                    <td className="p-3 text-center text-q-sub">{s.aiBuzzed}</td>
                    <td
                      className="p-3 text-center font-bold"
                      style={{ color: '#FF7A94' }}
                    >
                      {pct(s.aiCorrect, s.aiBuzzed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import/Export/Reset */}
      <div className="rounded-2xl bg-q-card p-5 shadow-card space-y-4">
        <h2 className="font-display text-base font-bold text-q-text">Data</h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-white/8 px-4 py-2.5 text-sm font-semibold text-q-text transition hover:bg-white/12 active:scale-[0.98] focus:outline-none"
            onClick={exportStatsAsJSON}
          >
            Export JSON ↓
          </button>
          <button
            type="button"
            className="rounded-xl bg-white/8 px-4 py-2.5 text-sm font-semibold text-q-text transition hover:bg-white/12 active:scale-[0.98] focus:outline-none"
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON ↑
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
        </div>

        {importSuccess && (
          <p className="text-sm font-semibold" style={{ color: '#00D4A4' }}>
            Stats imported and merged successfully.
          </p>
        )}
        {importError && (
          <p className="text-sm font-semibold" style={{ color: '#FF3F5E' }}>
            {importError}
          </p>
        )}

        {!confirmReset ? (
          <button
            type="button"
            className="text-sm text-q-dim transition hover:text-q-red focus:outline-none"
            onClick={() => setConfirmReset(true)}
          >
            Reset all stats…
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-q-sub">This cannot be undone.</span>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition focus:outline-none"
              style={{ backgroundColor: '#FF3F5E' }}
              onClick={() => {
                resetStats()
                refresh()
                setConfirmReset(false)
              }}
            >
              Confirm reset
            </button>
            <button
              type="button"
              className="text-xs text-q-dim transition hover:text-q-sub focus:outline-none"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function RecordCell({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <div className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-q-dim">
        {label}
      </div>
    </div>
  )
}
