import type { Question } from './types'

export type QuestionCount = number | 'all'

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickCount(questions: Question[], count: QuestionCount): Question[] {
  if (count === 'all') return questions
  return questions.slice(0, Math.min(count, questions.length))
}

export function scoreAnswers(
  questions: Question[],
  answers: Array<number | null>,
): number {
  let score = 0
  for (let i = 0; i < questions.length; i++) {
    const ans = answers[i]
    if (ans === null) continue
    if (ans === questions[i]?.correct_index) score++
  }
  return score
}

