import type { Question } from "../lib/types";
import { OptionButton, type OptionState } from "./OptionButton";

export function QuestionCard({
  question,
  selectedIndex,
  onSelect,
}: {
  question: Question;
  selectedIndex: number | null;
  onSelect: (optionIndex: number) => void;
}) {
  const answered = selectedIndex !== null;

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div className="min-h-[120px] rounded-2xl bg-q-card p-6 text-center shadow-card">
        <p className="font-display text-2xl font-bold leading-snug text-q-text sm:text-3xl">
          {question.question}
        </p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((opt, idx) => {
          let state: OptionState = "idle";
          if (answered) {
            const isCorrect = idx === question.correct_index;
            const isSelected = idx === selectedIndex;
            if (isSelected && isCorrect) state = "selectedCorrect";
            else if (isSelected && !isCorrect) state = "selectedWrong";
            else if (!isSelected && isCorrect) state = "correctReveal";
            else state = "dimmed";
          }

          return (
            <OptionButton
              key={idx}
              index={idx}
              label={opt}
              state={state}
              disabled={answered}
              onClick={() => onSelect(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}
