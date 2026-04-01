import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { validateMode, type ValidationError } from '../lib/validate'
import type { Mode } from '../lib/types'
import { useQuizStore } from '../store/quizStore'

type ParseState =
  | { stage: 'idle' }
  | { stage: 'error'; message: string; errors?: ValidationError[] }
  | { stage: 'ready'; mode: Mode; fileName: string }

const SCHEMA_EXAMPLE = `{
  "mode": "my_topic",
  "label": "My Topic",
  "icon": "🎯",
  "color": "#A78BFA",
  "questions": [
    {
      "id": "q1",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correct_index": 1,
      "explanation": "Optional explanation."
    }
  ]
}`

export function Upload() {
  const navigate = useNavigate()
  const addMode = useQuizStore((s) => s.addMode)
  const selectMode = useQuizStore((s) => s.selectMode)
  const existingModes = useQuizStore((s) => s.modes)

  const [state, setState] = useState<ParseState>({ stage: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.json')) {
        setState({ stage: 'error', message: 'File must be a .json file.' })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text !== 'string') return

        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch {
          setState({ stage: 'error', message: 'Could not parse file — invalid JSON syntax.' })
          return
        }

        const result = validateMode(parsed)
        if (!result.ok) {
          setState({ stage: 'error', message: 'Validation failed.', errors: result.errors })
          return
        }

        setState({ stage: 'ready', mode: result.mode, fileName: file.name })
      }
      reader.readAsText(file)
    },
    [],
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleUse = () => {
    if (state.stage !== 'ready') return
    addMode(state.mode)
    selectMode(state.mode)
    navigate('/config')
  }

  const duplicate =
    state.stage === 'ready' &&
    existingModes.some(
      (m) => m.mode === state.mode.mode && m.mode !== 'mixed',
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-q-text">Upload questions</h1>
          <p className="mt-1 text-sm text-q-sub">
            Drop a JSON file matching the schema below — it'll be validated and added for this session.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-q-sub transition hover:text-q-text"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={[
          'relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl p-10 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-q-purple',
          dragging
            ? 'scale-[1.01]'
            : 'hover:bg-white/5',
        ].join(' ')}
        style={{
          backgroundColor: dragging ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)',
          boxShadow: dragging ? '0 0 0 2px rgba(167,139,250,0.5)' : 'none',
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className="sr-only"
          onChange={onFileChange}
        />
        <div className="text-4xl">📂</div>
        <div className="font-display text-lg font-semibold text-q-text">
          Drop your JSON file here
        </div>
        <div className="text-sm text-q-sub">or click to browse</div>
      </div>

      {/* Feedback */}
      <AnimatePresence mode="wait">
        {state.stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-5 shadow-card"
            style={{ backgroundColor: 'rgba(255,63,94,0.1)' }}
          >
            <div className="font-semibold text-q-red mb-1">✗ {state.message}</div>
            {state.errors && state.errors.length > 0 && (
              <ul className="mt-3 space-y-1">
                {state.errors.map((err, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <code
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs font-mono"
                      style={{ backgroundColor: 'rgba(255,63,94,0.15)', color: '#FF7A94' }}
                    >
                      {err.path}
                    </code>
                    <span className="text-q-sub">{err.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {state.stage === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Preview card */}
            <div
              className="relative overflow-hidden rounded-2xl p-5 shadow-card"
              style={{ backgroundColor: '#141826' }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 20% 20%, ${state.mode.color}22, transparent 60%)`,
                }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="grid size-14 place-items-center rounded-xl text-3xl"
                  style={{ backgroundColor: `${state.mode.color}22` }}
                >
                  {state.mode.icon}
                </div>
                <div className="flex-1">
                  <div className="font-display text-xl font-bold text-q-text">
                    {state.mode.label}
                  </div>
                  <div className="mt-0.5 text-sm text-q-sub">
                    {state.mode.questions.length} questions · {state.fileName}
                  </div>
                </div>
                <div
                  className="rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: 'rgba(0,212,164,0.15)', color: '#00D4A4' }}
                >
                  ✓ Valid
                </div>
              </div>
            </div>

            {duplicate && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-q-sub"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
              >
                ⚠ A mode with slug <code className="font-mono">"{state.mode.mode}"</code> already exists — it will be replaced.
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl py-3.5 font-display text-base font-bold text-black shadow-lift transition hover:brightness-110 active:scale-[0.98] focus:outline-none"
                style={{ backgroundColor: state.mode.color }}
                onClick={handleUse}
              >
                Use this mode →
              </button>
              <button
                type="button"
                className="rounded-xl bg-white/8 px-5 py-3.5 font-display text-base font-bold text-q-text transition hover:bg-white/12 active:scale-[0.98] focus:outline-none"
                onClick={() => setState({ stage: 'idle' })}
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schema reference */}
      <details className="group">
        <summary className="cursor-pointer list-none text-sm text-q-sub transition hover:text-q-text select-none">
          <span className="group-open:hidden">▶ Show expected JSON schema</span>
          <span className="hidden group-open:inline">▼ Hide schema</span>
        </summary>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-q-card p-5 shadow-card">
          <pre className="font-mono text-xs leading-relaxed text-q-sub">{SCHEMA_EXAMPLE}</pre>
          <div className="mt-4 space-y-1.5 text-xs text-q-sub">
            {[
              ['mode', 'string', 'Unique slug, used as the mode ID'],
              ['label', 'string', 'Display name shown on the card'],
              ['icon', 'string', 'Emoji shown on the card'],
              ['color', 'string', 'Hex accent colour, e.g. #A78BFA'],
              ['questions[].id', 'string', 'Unique within the file'],
              ['questions[].question', 'string', 'The question text'],
              ['questions[].options', 'string[]', '2–6 answer choices'],
              ['questions[].correct_index', 'number', 'Zero-based index into options'],
              ['questions[].explanation', 'string?', 'Optional — shown in results'],
              ['questions[].difficulty', '"easy"|"medium"|"hard"?', 'Optional'],
            ].map(([field, type, desc]) => (
              <div key={field} className="flex gap-3">
                <code
                  className="w-44 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#A78BFA' }}
                >
                  {field}
                </code>
                <code
                  className="w-36 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#8494B4' }}
                >
                  {type}
                </code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
    </motion.div>
  )
}
