import type { Question } from '../lib/types'

export function ReviewItem({
  question,
  selectedIndex,
}: {
  question: Question
  selectedIndex: number | null
}) {
  const correctText = question.options[question.correct_index] ?? 'Unknown'
  const timedOut = selectedIndex === -1
  const selectedText = timedOut
    ? 'Time expired'
    : selectedIndex === null
      ? 'No answer'
      : (question.options[selectedIndex] ?? '—')
  const isCorrect = selectedIndex === question.correct_index

  // Subtle but clearly different card tints using inline rgba so
  // Tailwind's oklch fractional opacity doesn't wash them out
  const cardStyle: React.CSSProperties = isCorrect
    ? { backgroundColor: 'rgba(0,212,164,0.07)' }
    : { backgroundColor: '#141826' } // = q-card solid

  const badgeStyle: React.CSSProperties = isCorrect
    ? { backgroundColor: 'rgba(0,212,164,0.18)', color: '#00D4A4' }
    : { backgroundColor: 'rgba(255,63,94,0.18)', color: '#FF3F5E' }

  const wrongAnswerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,63,94,0.12)',
    color: '#FF7A94',
  }
  const rightAnswerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0,212,164,0.12)',
    color: '#00D4A4',
  }

  return (
    <div className="rounded-2xl p-5 shadow-card" style={cardStyle}>
      {/* Question + badge */}
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-lg font-semibold leading-snug text-q-text">
          {question.question}
        </p>
        <div
          className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold"
          style={badgeStyle}
        >
          {isCorrect ? '✓ Correct' : timedOut ? '⏱ Timed out' : '✗ Wrong'}
        </div>
      </div>

      {/* Answers */}
      <div className="mt-4 space-y-2">
        {!isCorrect && (
          <div className="rounded-xl px-4 py-3" style={wrongAnswerStyle}>
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,99,130,0.7)' }}
            >
              Your answer
            </div>
            <div className="text-base font-semibold" style={{ color: '#FF7A94' }}>
              {selectedText}
            </div>
          </div>
        )}
        <div className="rounded-xl px-4 py-3" style={rightAnswerStyle}>
          <div
            className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(0,212,164,0.6)' }}
          >
            Correct answer
          </div>
          <div className="text-base font-semibold" style={{ color: '#00D4A4' }}>
            {correctText}
          </div>
        </div>
      </div>

      {question.explanation && (
        <p className="mt-4 text-sm leading-relaxed text-q-sub">{question.explanation}</p>
      )}
    </div>
  )
}
