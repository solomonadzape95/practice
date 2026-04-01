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

  addMode: (mode: Mode) => void
  selectMode: (mode: Mode) => void
  startQuiz: (count: 5 | 10 | 20 | 'all') => void
  answerQuestion: (optionIndex: number) => void
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

  startQuiz: (count) => {
    const { selectedMode } = get()
    if (!selectedMode) return

    const chosen = pickCount(shuffle(selectedMode.questions), count)
    set({
      questions: chosen,
      answers: Array(chosen.length).fill(null),
      currentIndex: 0,
      score: 0,
      status: 'active',
    })
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
    })
  },
}))

