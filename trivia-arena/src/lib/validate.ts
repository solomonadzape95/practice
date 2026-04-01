import type { Difficulty, Mode, Question } from './types'

export type ValidationError = { path: string; message: string }
export type ValidationResult =
  | { ok: true; mode: Mode }
  | { ok: false; errors: ValidationError[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

function validateQuestion(
  q: unknown,
  idx: number,
  errors: ValidationError[],
): q is Question {
  const p = `questions[${idx}]`
  if (!isRecord(q)) {
    errors.push({ path: p, message: 'must be an object' })
    return false
  }
  let ok = true
  if (typeof q.id !== 'string' || q.id.trim() === '') {
    errors.push({ path: `${p}.id`, message: 'must be a non-empty string' })
    ok = false
  }
  if (typeof q.question !== 'string' || q.question.trim() === '') {
    errors.push({ path: `${p}.question`, message: 'must be a non-empty string' })
    ok = false
  }
  if (!Array.isArray(q.options)) {
    errors.push({ path: `${p}.options`, message: 'must be an array' })
    ok = false
  } else {
    if (q.options.length < 2 || q.options.length > 6) {
      errors.push({ path: `${p}.options`, message: `must have 2–6 items (found ${q.options.length})` })
      ok = false
    } else if (!q.options.every((o) => typeof o === 'string' && o.trim() !== '')) {
      errors.push({ path: `${p}.options`, message: 'all items must be non-empty strings' })
      ok = false
    }
  }
  if (typeof q.correct_index !== 'number' || !Number.isInteger(q.correct_index)) {
    errors.push({ path: `${p}.correct_index`, message: 'must be an integer' })
    ok = false
  } else if (
    Array.isArray(q.options) &&
    (q.correct_index < 0 || q.correct_index >= q.options.length)
  ) {
    errors.push({
      path: `${p}.correct_index`,
      message: `${q.correct_index} is out of range (options has ${q.options.length} items)`,
    })
    ok = false
  }
  if (q.explanation !== undefined && typeof q.explanation !== 'string') {
    errors.push({ path: `${p}.explanation`, message: 'must be a string if present' })
    ok = false
  }
  if (q.difficulty !== undefined && !isDifficulty(q.difficulty)) {
    errors.push({ path: `${p}.difficulty`, message: 'must be "easy", "medium", or "hard" if present' })
    ok = false
  }
  return ok
}

export function validateMode(raw: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!isRecord(raw)) {
    return { ok: false, errors: [{ path: 'root', message: 'JSON must be an object' }] }
  }

  if (typeof raw.mode !== 'string' || raw.mode.trim() === '')
    errors.push({ path: 'mode', message: 'must be a non-empty string (used as unique ID)' })
  if (typeof raw.label !== 'string' || raw.label.trim() === '')
    errors.push({ path: 'label', message: 'must be a non-empty string (display name)' })
  if (typeof raw.icon !== 'string' || raw.icon.trim() === '')
    errors.push({ path: 'icon', message: 'must be a non-empty string (emoji)' })
  if (typeof raw.color !== 'string' || raw.color.trim() === '')
    errors.push({ path: 'color', message: 'must be a non-empty hex colour string' })

  if (!Array.isArray(raw.questions)) {
    errors.push({ path: 'questions', message: 'must be an array' })
  } else if (raw.questions.length === 0) {
    errors.push({ path: 'questions', message: 'must contain at least one question' })
  } else {
    const ids = new Set<string>()
    for (let i = 0; i < raw.questions.length; i++) {
      const q = raw.questions[i]
      if (validateQuestion(q, i, errors) && isRecord(q) && typeof q.id === 'string') {
        if (ids.has(q.id)) {
          errors.push({ path: `questions[${i}].id`, message: `duplicate id "${q.id}"` })
        }
        ids.add(q.id)
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, mode: raw as unknown as Mode }
}
