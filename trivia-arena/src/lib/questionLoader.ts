import africanArt from '../questions/african_art.json'
import africanGeography from '../questions/african_geography.json'
import africanHistory from '../questions/african_history.json'
import dataAnalysis from '../questions/data_analysis.json'
import generalKnowledge from '../questions/general_knowledge copy.json'
import history from '../questions/history.json'
import maths from '../questions/maths.json'
import mixedGk from '../questions/mixed_gk.json'
import verbal from '../questions/verbal.json'
import wildlifeBorders from '../questions/wildlife_borders.json'
import type { Mode, Question } from './types'
import { validateMode } from './validate'

const ALL_MODULES: unknown[] = [
  africanArt,
  africanGeography,
  africanHistory,
  dataAnalysis,
  generalKnowledge,
  history,
  maths,
  mixedGk,
  verbal,
  wildlifeBorders,
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function loadAllModes(): Mode[] {
  const out: Mode[] = []

  for (const mod of ALL_MODULES) {
    const result = validateMode(mod)
    if (!result.ok) {
      const maybeMode = isRecord(mod) ? mod.mode : undefined
      console.warn(`Skipping invalid question file: ${maybeMode ?? 'unknown'}`)
      continue
    }
    out.push(result.mode)
  }

  out.sort((a, b) => a.label.localeCompare(b.label))

  // Synthetic "Mixed" mode — all questions from every topic, de-duped IDs
  if (out.length > 1) {
    const allQuestions: Question[] = out.flatMap((m) =>
      m.questions.map((q) => ({ ...q, id: `${m.mode}__${q.id}` })),
    )
    const mixed: Mode = {
      mode: 'mixed',
      label: 'Mixed — All Topics',
      icon: '⚡',
      color: '#A78BFA',
      questions: allQuestions,
    }
    out.unshift(mixed)
  }

  return out
}
