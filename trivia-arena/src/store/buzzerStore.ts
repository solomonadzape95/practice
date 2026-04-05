import { create } from 'zustand'
import { pickCount, shuffle } from '../lib/quiz'
import type {
  BuzzerGameStatus,
  BuzzerRound,
  Mode,
  Opponent,
  Question,
  QuestionPhase,
} from '../lib/types'

// ── AI profiles ─────────────────────────────────────────────────────────────

export const OPPONENT_PROFILES: Record<
  Opponent,
  { label: string; buzzMin: number; buzzMax: number; accuracy: number; description: string }
> = {
  solomon: {
    label: 'Solomon',
    buzzMin: 3000,
    buzzMax: 6000,
    accuracy: 0.55,
    description: 'Slow to react, often guesses wrong.',
  },
  abayomi: {
    label: 'Abayomi',
    buzzMin: 1500,
    buzzMax: 3000,
    accuracy: 0.75,
    description: 'Balanced speed and accuracy.',
  },
  quayum: {
    label: 'Quayum',
    buzzMin: 500,
    buzzMax: 1500,
    accuracy: 0.90,
    description: 'Lightning fast, rarely wrong.',
  },
}

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generate the answer index the AI will choose given its accuracy. */
function aiChosenIndex(question: Question, accuracy: number): number {
  if (Math.random() < accuracy) return question.correct_index
  // Pick a random wrong answer
  const wrong = question.options
    .map((_, i) => i)
    .filter((i) => i !== question.correct_index)
  return wrong[Math.floor(Math.random() * wrong.length)] ?? 0
}

// ── Store ───────────────────────────────────────────────────────────────────

export interface BuzzerStore {
  status: BuzzerGameStatus
  opponent: Opponent
  selectedMode: Mode | null
  questions: Question[]
  currentIndex: number
  phase: QuestionPhase
  humanScore: number
  aiScore: number
  rounds: BuzzerRound[]

  /** Scheduled AI buzz delay for the current question (ms). Set externally by
   *  the component so it can be cancelled when the human buzzes first. */
  aiBuzzDelayMs: number

  /** Answer the AI has pre-computed for the current question. */
  aiAnswer: number | null

  startGame: (mode: Mode, count: number | 'all', opponent: Opponent) => void
  humanBuzz: () => void
  humanAnswer: (optionIndex: number) => void
  /** Called by the AI timer in the component when the delay fires. */
  aiBuzz: () => void
  humanTimeout: () => void
  advanceQuestion: () => void
  resetGame: () => void
}

export const useBuzzerStore = create<BuzzerStore>((set, get) => ({
  status: 'idle',
  opponent: 'abayomi',
  selectedMode: null,
  questions: [],
  currentIndex: 0,
  phase: 'waiting',
  humanScore: 0,
  aiScore: 0,
  rounds: [],
  aiBuzzDelayMs: 3000,
  aiAnswer: null,

  startGame: (mode, count, opponent) => {
    const questions = pickCount(shuffle(mode.questions), count)
    const profile = OPPONENT_PROFILES[opponent]
    set({
      status: 'active',
      opponent,
      selectedMode: mode,
      questions,
      currentIndex: 0,
      phase: 'waiting',
      humanScore: 0,
      aiScore: 0,
      rounds: [],
      aiBuzzDelayMs: randBetween(profile.buzzMin, profile.buzzMax),
      aiAnswer: aiChosenIndex(questions[0]!, profile.accuracy),
    })
  },

  humanBuzz: () => {
    const { phase } = get()
    if (phase !== 'waiting') return
    set({ phase: 'buzzed_human' })
  },

  humanAnswer: (optionIndex) => {
    const { phase, currentIndex, questions, rounds, humanScore, opponent } = get()
    if (phase !== 'buzzed_human') return
    const q = questions[currentIndex]
    if (!q) return
    const correct = optionIndex === q.correct_index
    const round: BuzzerRound = {
      questionId: q.id,
      modeSlug: get().selectedMode?.mode ?? '',
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      buzzWinner: 'human',
      answeredBy: 'human',
      humanAnswerIndex: optionIndex,
      aiAnswerIndex: null,
      correct,
      timedOut: false,
    }
    set({
      phase: 'post_answer',
      rounds: [...rounds, round],
      humanScore: correct ? humanScore + 1 : humanScore,
    })
    // Recompute AI answer for the next question
    const profile = OPPONENT_PROFILES[opponent]
    const next = questions[currentIndex + 1]
    if (next) {
      set({
        aiBuzzDelayMs: randBetween(profile.buzzMin, profile.buzzMax),
        aiAnswer: aiChosenIndex(next, profile.accuracy),
      })
    }
  },

  humanTimeout: () => {
    const { phase, currentIndex, questions, rounds, opponent } = get()
    if (phase !== 'buzzed_human') return
    const q = questions[currentIndex]
    if (!q) return
    const round: BuzzerRound = {
      questionId: q.id,
      modeSlug: get().selectedMode?.mode ?? '',
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      buzzWinner: 'human',
      answeredBy: null,
      humanAnswerIndex: null,
      aiAnswerIndex: null,
      correct: null,
      timedOut: true,
    }
    const profile = OPPONENT_PROFILES[opponent]
    const next = questions[currentIndex + 1]
    set({
      phase: 'post_answer',
      rounds: [...rounds, round],
      ...(next
        ? {
            aiBuzzDelayMs: randBetween(profile.buzzMin, profile.buzzMax),
            aiAnswer: aiChosenIndex(next, profile.accuracy),
          }
        : {}),
    })
  },

  aiBuzz: () => {
    const { phase, currentIndex, questions, rounds, aiScore, opponent } = get()
    if (phase !== 'waiting') return
    const q = questions[currentIndex]
    if (!q) return
    const answerIndex = get().aiAnswer ?? aiChosenIndex(q, OPPONENT_PROFILES[opponent].accuracy)
    const correct = answerIndex === q.correct_index
    const round: BuzzerRound = {
      questionId: q.id,
      modeSlug: get().selectedMode?.mode ?? '',
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      buzzWinner: 'ai',
      answeredBy: 'ai',
      humanAnswerIndex: null,
      aiAnswerIndex: answerIndex,
      correct,
      timedOut: false,
    }
    const profile = OPPONENT_PROFILES[opponent]
    const next = questions[currentIndex + 1]
    set({
      phase: 'post_answer',
      rounds: [...rounds, round],
      aiScore: correct ? aiScore + 1 : aiScore,
      ...(next
        ? {
            aiBuzzDelayMs: randBetween(profile.buzzMin, profile.buzzMax),
            aiAnswer: aiChosenIndex(next, profile.accuracy),
          }
        : {}),
    })
  },

  advanceQuestion: () => {
    const { currentIndex, questions } = get()
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      set({ status: 'results', phase: 'waiting' })
      return
    }
    set({ currentIndex: nextIndex, phase: 'waiting' })
  },

  resetGame: () => {
    set({
      status: 'idle',
      selectedMode: null,
      questions: [],
      currentIndex: 0,
      phase: 'waiting',
      humanScore: 0,
      aiScore: 0,
      rounds: [],
      aiBuzzDelayMs: 3000,
      aiAnswer: null,
    })
  },
}))
