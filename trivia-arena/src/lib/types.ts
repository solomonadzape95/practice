export type QuizStatus = 'idle' | 'configuring' | 'active' | 'results'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  difficulty?: Difficulty
}

export interface Mode {
  mode: string
  label: string
  icon: string
  color: string
  questions: Question[]
}

// ── Buzzer game ────────────────────────────────────────────────────────────

export type Opponent = 'solomon' | 'abayomi' | 'quayum'
export type BuzzWinner = 'human' | 'ai' | null
export type QuestionPhase = 'waiting' | 'buzzed_human' | 'buzzed_ai' | 'post_answer'
export type BuzzerGameStatus = 'idle' | 'active' | 'results'

export interface BuzzerRound {
  questionId: string
  modeSlug: string
  question: string
  options: string[]
  correctIndex: number
  buzzWinner: BuzzWinner
  answeredBy: 'human' | 'ai' | null
  humanAnswerIndex: number | null
  aiAnswerIndex: number | null
  correct: boolean | null
  timedOut: boolean
}

