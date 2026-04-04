import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TimerBar } from "../components/TimerBar";
import { ProgressBar } from "../components/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { useQuestionTimer } from "../hooks/useQuestionTimer";
import { useQuizStore } from "../store/quizStore";

const INTER_QUESTION_DELAY = 3; // seconds before auto-advancing

export function Quiz() {
  const navigate = useNavigate();
  const status = useQuizStore((s) => s.status);
  const selectedMode = useQuizStore((s) => s.selectedMode);
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const answers = useQuizStore((s) => s.answers);
  const timeLimitPerQuestion = useQuizStore((s) => s.timeLimitPerQuestion);
  const answerQuestion = useQuizStore((s) => s.answerQuestion);
  const timeoutQuestion = useQuizStore((s) => s.timeoutQuestion);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);

  const [isPaused, setIsPaused] = useState(false);
  // delayLeft: null = not in delay phase; number = seconds remaining before auto-advance
  const [delayLeft, setDelayLeft] = useState<number | null>(null);
  const delayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "results") navigate("/results", { replace: true });
  }, [navigate, status]);

  useEffect(() => {
    if (status === "idle") navigate("/", { replace: true });
    if (status === "configuring") navigate("/config", { replace: true });
  }, [navigate, status]);

  // Reset delay phase when question changes
  useEffect(() => {
    setDelayLeft(null);
    if (delayIntervalRef.current) clearInterval(delayIntervalRef.current);
  }, [currentIndex]);

  // Spacebar → pause/resume (only when active, not in delay phase)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLButtonElement
      )
        return;
      if (status !== "active") return;
      if (delayLeft !== null) return;
      e.preventDefault();
      setIsPaused((p) => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, delayLeft]);

  const q = questions[currentIndex];
  const selectedIndex = q ? (answers[currentIndex] ?? null) : null;
  const answered = selectedIndex !== null;
  const isLast = currentIndex === questions.length - 1;

  const { pct: timerPct } = useQuestionTimer({
    duration: timeLimitPerQuestion,
    questionKey: q?.id ?? "",
    isPaused,
    isStopped: answered,
    onExpire: () => {
      timeoutQuestion();
      startDelay();
    },
  });

  function startDelay() {
    setDelayLeft(INTER_QUESTION_DELAY);
    if (delayIntervalRef.current) clearInterval(delayIntervalRef.current);
    delayIntervalRef.current = setInterval(() => {
      setDelayLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(delayIntervalRef.current!);
          // Auto-advance
          nextQuestion();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleAnswer(idx: number) {
    answerQuestion(idx);
    startDelay();
  }

  function handleSkip() {
    if (delayIntervalRef.current) clearInterval(delayIntervalRef.current);
    setDelayLeft(null);
    nextQuestion();
  }

  // Pause freezes the delay countdown too
  useEffect(() => {
    if (delayLeft === null) return;
    if (isPaused) {
      clearInterval(delayIntervalRef.current!);
    } else {
      // Resume: restart interval from current delayLeft
      delayIntervalRef.current = setInterval(() => {
        setDelayLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(delayIntervalRef.current!);
            nextQuestion();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(delayIntervalRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  if (status !== "active" || !selectedMode) return null;
  if (!q) return null;

  const color = selectedMode.color;
  const inDelay = delayLeft !== null;
  const delayPct = inDelay ? delayLeft / INTER_QUESTION_DELAY : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header bar */}
        <div className="flex items-center gap-3">
          <div
            className="grid size-8 place-items-center rounded-lg text-base"
            style={{ backgroundColor: `${color}22` }}
          >
            {selectedMode.icon}
          </div>
          <div className="flex-1">
            <ProgressBar
              current={currentIndex + 1}
              total={questions.length}
              color={color}
            />
          </div>

          {/* Pause button */}
          <button
            type="button"
            aria-label={isPaused ? "Resume quiz" : "Pause quiz"}
            className="grid size-8 place-items-center rounded-lg text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-q-purple"
            style={{ backgroundColor: `${color}22`, color }}
            onClick={() => setIsPaused((p) => !p)}
            disabled={inDelay}
          >
            {isPaused ? "▶" : "⏸"}
          </button>
        </div>

        {/* Paused banner */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between rounded-xl px-4 py-2.5"
              style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33` }}
            >
              <span className="text-sm font-semibold" style={{ color }}>
                ⏸ Paused — timer is frozen
              </span>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs font-bold text-black transition hover:brightness-110 focus:outline-none"
                style={{ backgroundColor: color }}
                onClick={() => setIsPaused(false)}
              >
                Resume
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question + options */}
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <QuestionCard
                question={q}
                selectedIndex={selectedIndex}
                onSelect={!isPaused ? handleAnswer : () => {}}
              />
            </motion.div>
          </AnimatePresence>

          {/* Footer: delay countdown or continue hint */}
          <div className="flex items-center justify-between min-h-[44px]">
            <AnimatePresence mode="wait">
                {inDelay ? (
                  <motion.div
                    key="delay"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-1 items-center gap-4"
                  >
                    <div className="text-sm text-q-sub">
                      Next question in{" "}
                      <span
                        className="font-bold tabular-nums"
                        style={{ color }}
                      >
                        {delayLeft}s
                      </span>
                    </div>
                    {/* Mini delay progress bar */}
                    <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/8">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: color,
                          width: `${delayPct * 100}%`,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="rounded-xl px-5 py-2.5 font-display text-sm font-bold text-black shadow-lift transition hover:brightness-110 active:scale-[0.98] focus:outline-none"
                      style={{ backgroundColor: color }}
                      onClick={handleSkip}
                    >
                      {isLast ? "See Results →" : "Skip →"}
                    </button>
                  </motion.div>
                ) : answered ? null : (
                  <motion.div
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-q-dim"
                  >
                    {timeLimitPerQuestion > 0 ? null : "Select an answer"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
      </motion.div>

      {/* Fixed timer bar at viewport bottom */}
      <TimerBar
        pct={timerPct}
        color={color}
        hidden={timeLimitPerQuestion === 0 || answered || isPaused}
      />
    </>
  );
}
