import type { BuzzerRound, Opponent } from './types'

const STORAGE_KEY = 'buzzer_stats'

// ── Schema ───────────────────────────────────────────────────────────────────

export interface OpponentRecord {
  gamesPlayed: number
  humanWins: number
  aiWins: number
  draws: number
  humanBuzzed: number
  aiBuzzed: number
  humanCorrect: number
  aiCorrect: number
  humanTimedOut: number
}

export interface SubjectRecord {
  label: string
  humanBuzzed: number
  aiBuzzed: number
  humanCorrect: number
  aiCorrect: number
  humanTimedOut: number
  aiTimedOut: number
}

export interface BuzzerStats {
  lastUpdated: string
  byOpponent: Record<Opponent, OpponentRecord>
  bySubject: Record<string, SubjectRecord>
}

// ── Defaults ─────────────────────────────────────────────────────────────────

function emptyOpponentRecord(): OpponentRecord {
  return {
    gamesPlayed: 0,
    humanWins: 0,
    aiWins: 0,
    draws: 0,
    humanBuzzed: 0,
    aiBuzzed: 0,
    humanCorrect: 0,
    aiCorrect: 0,
    humanTimedOut: 0,
  }
}

export function emptyStats(): BuzzerStats {
  return {
    lastUpdated: new Date().toISOString(),
    byOpponent: {
      solomon: emptyOpponentRecord(),
      abayomi: emptyOpponentRecord(),
      quayum: emptyOpponentRecord(),
    },
    bySubject: {},
  }
}

// ── localStorage I/O ─────────────────────────────────────────────────────────

export function loadStats(): BuzzerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStats()
    return JSON.parse(raw) as BuzzerStats
  } catch {
    return emptyStats()
  }
}

export function saveStats(stats: BuzzerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

export function mergeGameRounds(
  rounds: BuzzerRound[],
  opponent: Opponent,
  humanScore: number,
  aiScore: number,
  modeLabelMap: Record<string, string>,
): void {
  const stats = loadStats()

  // Per-opponent aggregate
  const opp = stats.byOpponent[opponent]
  opp.gamesPlayed += 1
  if (humanScore > aiScore) opp.humanWins += 1
  else if (aiScore > humanScore) opp.aiWins += 1
  else opp.draws += 1

  for (const r of rounds) {
    if (r.buzzWinner === 'human') {
      opp.humanBuzzed += 1
      if (r.correct === true) opp.humanCorrect += 1
      if (r.timedOut) opp.humanTimedOut += 1
    } else if (r.buzzWinner === 'ai') {
      opp.aiBuzzed += 1
      if (r.correct === true) opp.aiCorrect += 1
    }

    // Per-subject aggregate
    const slug = r.modeSlug
    if (!stats.bySubject[slug]) {
      stats.bySubject[slug] = {
        label: modeLabelMap[slug] ?? slug,
        humanBuzzed: 0,
        aiBuzzed: 0,
        humanCorrect: 0,
        aiCorrect: 0,
        humanTimedOut: 0,
        aiTimedOut: 0,
      }
    }
    const sub = stats.bySubject[slug]!
    if (r.buzzWinner === 'human') {
      sub.humanBuzzed += 1
      if (r.correct === true) sub.humanCorrect += 1
      if (r.timedOut) sub.humanTimedOut += 1
    } else if (r.buzzWinner === 'ai') {
      sub.aiBuzzed += 1
      if (r.correct === true) sub.aiCorrect += 1
    }
  }

  stats.lastUpdated = new Date().toISOString()
  saveStats(stats)
}

// ── Export / Import ───────────────────────────────────────────────────────────

export function exportStatsAsJSON(): void {
  const stats = loadStats()
  const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trivia_arena_buzzer_stats_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importStatsFromJSON(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as BuzzerStats
        // Merge imported into existing
        const current = loadStats()

        // Merge byOpponent
        for (const key of Object.keys(imported.byOpponent) as Opponent[]) {
          const src = imported.byOpponent[key]
          const dst = current.byOpponent[key]
          if (!src || !dst) continue
          dst.gamesPlayed += src.gamesPlayed
          dst.humanWins += src.humanWins
          dst.aiWins += src.aiWins
          dst.draws += src.draws
          dst.humanBuzzed += src.humanBuzzed
          dst.aiBuzzed += src.aiBuzzed
          dst.humanCorrect += src.humanCorrect
          dst.aiCorrect += src.aiCorrect
          dst.humanTimedOut += src.humanTimedOut
        }

        // Merge bySubject
        for (const slug of Object.keys(imported.bySubject)) {
          const src = imported.bySubject[slug]!
          if (!current.bySubject[slug]) {
            current.bySubject[slug] = { ...src }
          } else {
            const dst = current.bySubject[slug]!
            dst.humanBuzzed += src.humanBuzzed
            dst.aiBuzzed += src.aiBuzzed
            dst.humanCorrect += src.humanCorrect
            dst.aiCorrect += src.aiCorrect
            dst.humanTimedOut += src.humanTimedOut
            dst.aiTimedOut += src.aiTimedOut
          }
        }

        current.lastUpdated = new Date().toISOString()
        saveStats(current)
        resolve()
      } catch {
        reject(new Error('Invalid stats JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function resetStats(): void {
  saveStats(emptyStats())
}
