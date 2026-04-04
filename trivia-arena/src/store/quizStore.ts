import { create } from 'zustand'
import { loadAllModes } from '../lib/questionLoader'
import { pickCount, scoreAnswers, shuffle } from '../lib/quiz'
import type { Mode, Question, QuizStatus } from '../lib/types'

export interface QuizStore {
  modes: Mode[]
  selectedMode: Mode | null
  questions: Question[]
  currentIndex: number
  answers: Array<number | null>
  score: number
  status: QuizStatus
  /** Seconds allowed per question. 0 means no timer. */
  timeLimitPerQuestion: number
  /** Indices of questions where the timer expired before the user answered. */
  timedOutQuestions: Set<number>
  /** IDs of questions already seen, keyed by mode slug. Persists across
   *  "Play Again" rounds so unseen questions are always served first. */
  seenByMode: Map<string, Set<string>>

  addMode: (mode: Mode) => void
  selectMode: (mode: Mode) => void
  startQuiz: (count: number | 'all', timeLimit: number) => void
  answerQuestion: (optionIndex: number) => void
  /** Called by the timer when it reaches zero. Stores -1 as the answer
   *  (sentinel for "timed out") and records the index in timedOutQuestions. */
  timeoutQuestion: () => void
  nextQuestion: () => void
  finishQuiz: () => void
  resetQuiz: () => void
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  modes: loadAllModes(),
  selectedMode: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  status: 'idle',
  timeLimitPerQuestion: 5,
  timedOutQuestions: new Set(),
  seenByMode: new Map(),

  addMode: (mode) => {
    set((state) => {
      // Replace if same mode slug, otherwise append
      const existing = state.modes.filter((m) => m.mode !== mode.mode && m.mode !== 'mixed')
      const updated = [...existing, mode].sort((a, b) => a.label.localeCompare(b.label))
      // Rebuild mixed
      const allQuestions: Question[] = updated.flatMap((m) =>
        m.questions.map((q) => ({ ...q, id: `${m.mode}__${q.id}` })),
      )
      const mixed: Mode = {
        mode: 'mixed',
        label: 'Mixed — All Topics',
        icon: '⚡',
        color: '#A78BFA',
        questions: allQuestions,
      }
      return { modes: [mixed, ...updated] }
    })
  },

  selectMode: (mode) => {
    set({
      selectedMode: mode,
      status: 'configuring',
      questions: [],
      answers: [],
      score: 0,
      currentIndex: 0,
    })
  },

  startQuiz: (count, timeLimit) => {
    const { selectedMode, seenByMode } = get()
    if (!selectedMode) return

    const modeKey = selectedMode.mode
    const seen = seenByMode.get(modeKey) ?? new Set<string>()

    const unseen = selectedMode.questions.filter((q) => !seen.has(q.id))
    const seenQuestions = selectedMode.questions.filter((q) => seen.has(q.id))

    // When the unseen pool runs dry, start a fresh cycle over all questions
    const poolExhausted = unseen.length === 0
    const orderedPool = poolExhausted
      ? shuffle(selectedMode.questions)
      : [...shuffle(unseen), ...shuffle(seenQuestions)]

    const chosen = pickCount(orderedPool, count)

    // Update seen set — reset it if we just exhausted the pool
    const baseSeen = poolExhausted ? new Set<string>() : new Set(seen)
    chosen.forEach((q) => baseSeen.add(q.id))
    const newSeenByMode = new Map(seenByMode)
    newSeenByMode.set(modeKey, baseSeen)

    set({
      questions: chosen,
      answers: Array(chosen.length).fill(null),
      currentIndex: 0,
      score: 0,
      status: 'active',
      timeLimitPerQuestion: timeLimit,
      timedOutQuestions: new Set(),
      seenByMode: newSeenByMode,
    })
  },

  timeoutQuestion: () => {
    const { status, currentIndex, questions, answers, timedOutQuestions } = get()
    if (status !== 'active') return
    if (!questions[currentIndex]) return
    if (answers[currentIndex] !== null) return

    const next = [...answers]
    next[currentIndex] = -1
    const newTimedOut = new Set(timedOutQuestions)
    newTimedOut.add(currentIndex)
    set({ answers: next, timedOutQuestions: newTimedOut })
  },

  answerQuestion: (optionIndex) => {
    const { status, currentIndex, questions, answers } = get()
    if (status !== 'active') return
    if (!questions[currentIndex]) return
    if (answers[currentIndex] !== null) return

    const next = [...answers]
    next[currentIndex] = optionIndex
    set({ answers: next })
  },

  nextQuestion: () => {
    const { status, currentIndex, questions, answers } = get()
    if (status !== 'active') return
    // null = unanswered (not yet responded); -1 = timed out; both block advance until set
    if (answers[currentIndex] === null) return

    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      get().finishQuiz()
      return
    }
    set({ currentIndex: nextIndex })
  },

  finishQuiz: () => {
    const { questions, answers } = get()
    set({
      score: scoreAnswers(questions, answers),
      status: 'results',
    })
  },

  resetQuiz: () => {
    const { modes } = get()
    set({
      modes,
      selectedMode: null,
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0,
      status: 'idle',
      timeLimitPerQuestion: 5,
      timedOutQuestions: new Set(),
      seenByMode: new Map(),
    })
  },
}))

