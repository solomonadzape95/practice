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

