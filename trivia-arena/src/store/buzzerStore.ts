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

export type OpponentProfile = {
  label: string
  buzzMin: number
  buzzMax: number
  /** Fallback accuracy when no subject-specific override is set (0–1). */
  accuracy: number
  /** Per-mode-slug accuracy overrides. Keyed by the mode's slug string. */
  subjectAccuracy: Record<string, number>
  description: string
}

export const OPPONENT_PROFILES: Record<Opponent, OpponentProfile> = {
  solomon: {
    label: 'Solomon',
    // Fast — just slightly slower than Quayum on average
    buzzMin: 1000,
    buzzMax: 2500,
    accuracy: 0.65,
    subjectAccuracy: {
      // Specialist: GK and verbal
      general_knowledge: 0.90,
      verbal:            0.90,
      mixed_gk:          0.84,
      african_art:       0.80,
      african_history:   0.80,
      african_geography: 0.80,
      wildlife_borders:  0.78,
      // Weaker: technical
      maths:             0.60,
      data_analysis:     0.60,
    },
    description: 'Nearly as fast as Quayum. Dominates GK and verbal, struggles with technical topics.',
  },
  abayomi: {
    label: 'Abayomi',
    // Slower and more deliberate
    buzzMin: 2500,
    buzzMax: 5000,
    accuracy: 0.68,
    subjectAccuracy: {
      // Strong: technical
      maths:             0.82,
      data_analysis:     0.82,
      african_geography: 0.65,
      wildlife_borders:  0.65,
      // Below average: GK and verbal
      general_knowledge: 0.52,
      verbal:            0.52,
      mixed_gk:          0.55,
      african_art:       0.52,
      african_history:   0.55,
    },
    description: 'Slow to buzz but sharp on technical subjects. Shaky on GK and verbal.',
  },
  quayum: {
    label: 'Quayum',
    // Lightning fast
    buzzMin: 500,
    buzzMax: 1500,
    accuracy: 0.80,
    subjectAccuracy: {
      // God-tier: technical
      maths:             0.98,
      data_analysis:     0.98,
      // Average elsewhere
      general_knowledge: 0.75,
      verbal:            0.75,
      mixed_gk:          0.75,
      african_art:       0.75,
      african_history:   0.75,
      african_geography: 0.75,
      wildlife_borders:  0.75,
    },
    description: 'Lightning fast. Near-perfect on maths and data analysis, average elsewhere.',
  },
}

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Resolve the subject slug for a question.
 *  In Mixed mode, question IDs are prefixed as "{subject}__{id}". */
function subjectOf(questionId: string, modeSlug: string): string {
  if (modeSlug === 'mixed') {
    const prefix = questionId.split('__')[0]
    return prefix ?? modeSlug
  }
  return modeSlug
}

/** Generate the answer index the AI will choose, using subject-specific accuracy. */
function aiChosenIndex(question: Question, profile: OpponentProfile, modeSlug: string): number {
  const subject = subjectOf(question.id, modeSlug)
  const accuracy = profile.subjectAccuracy[subject] ?? profile.accuracy
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
      aiAnswer: aiChosenIndex(questions[0]!, profile, mode.mode),
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
    const modeSlug = get().selectedMode?.mode ?? ''
    const next = questions[currentIndex + 1]
    if (next) {
      set({
        aiBuzzDelayMs: randBetween(profile.buzzMin, profile.buzzMax),
        aiAnswer: aiChosenIndex(next, profile, modeSlug),
      })
    }
  },

  humanTimeout: () => {
    const { phase, currentIndex, questions, rounds, opponent } = get()
    if (phase !== 'buzzed_human') return
    const q = questions[currentIndex]
    if (!q) return
    const modeSlug = get().selectedMode?.mode ?? ''
    const round: BuzzerRound = {
      questionId: q.id,
      modeSlug,
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
            aiAnswer: aiChosenIndex(next, profile, modeSlug),
          }
        : {}),
    })
  },

  aiBuzz: () => {
    const { phase, currentIndex, questions, rounds, aiScore, opponent } = get()
    if (phase !== 'waiting') return
    const q = questions[currentIndex]
    if (!q) return
    const modeSlug = get().selectedMode?.mode ?? ''
    const profile = OPPONENT_PROFILES[opponent]
    const answerIndex = get().aiAnswer ?? aiChosenIndex(q, profile, modeSlug)
    const correct = answerIndex === q.correct_index
    const round: BuzzerRound = {
      questionId: q.id,
      modeSlug,
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
    const next = questions[currentIndex + 1]
    set({
      phase: 'post_answer',
      rounds: [...rounds, round],
      aiScore: correct ? aiScore + 1 : aiScore,
      ...(next
        ? {
            aiBuzzDelayMs: randBetween(profile.buzzMin, profile.buzzMax),
            aiAnswer: aiChosenIndex(next, profile, modeSlug),
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
