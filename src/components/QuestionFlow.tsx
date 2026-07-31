"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { questions } from "@/lib/questions";

type AnswerMap = Record<string, string>;

export default function QuestionFlow({
  resumeText,
  onComplete,
}: {
  resumeText: string;
  onComplete: (answers: { question: string; answer: string }[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const progress = ((index + 1) / questions.length) * 100;

  const currentValue = useMemo(() => {
    if (question.type === "text") return draft;
    return answers[question.id] ?? "";
  }, [question, answers, draft]);

  const canAdvance = currentValue.trim().length > 0;

  const commitAndAdvance = (value: string) => {
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);
    setDraft("");

    if (isLast) {
      const formatted = questions.map((q) => ({
        question: q.prompt,
        answer: updated[q.id] ?? "",
      }));
      setSubmitting(true);
      onComplete(formatted);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-paper/10">
        <motion.div
          className="h-full rounded-full bg-spotlight"
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {submitting ? (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-paper/10">
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full bg-roast-red"
                animate={{ x: ["-40%", "180%"] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              />
            </div>
            <span className="font-display text-2xl tracking-wide text-paper">
              Writing your set&hellip;
            </span>
          </motion.div>
        ) : (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <span className="font-display text-sm tracking-[0.3em] text-spotlight">
              QUESTION {index + 1} OF {questions.length}
            </span>
            <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
              {question.prompt}
            </h2>

            {question.type === "scale" && (
              <div className="flex flex-col gap-3">
                <input
                  type="range"
                  min={question.min}
                  max={question.max}
                  value={currentValue || question.min}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [question.id]: e.target.value }))
                  }
                  className="w-full accent-roast-red"
                />
                <div className="flex justify-between text-xs text-smoke/70">
                  <span>{question.minLabel}</span>
                  <span className="font-display text-xl text-roast-red">
                    {currentValue || question.min}
                  </span>
                  <span>{question.maxLabel}</span>
                </div>
              </div>
            )}

            {question.type === "choice" && (
              <div className="flex flex-col gap-3">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [question.id]: opt }))}
                    className={`rounded-sm border px-4 py-3 text-left text-sm transition-colors ${
                      currentValue === opt
                        ? "border-roast-red bg-roast-red/10 text-paper"
                        : "border-smoke/20 text-smoke hover:border-smoke/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {question.type === "text" && (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={question.placeholder}
                rows={3}
                className="rounded-sm border border-smoke/20 bg-transparent px-4 py-3 text-sm text-paper placeholder:text-smoke/40 focus:border-roast-red focus:outline-none"
              />
            )}

            <button
              onClick={() => commitAndAdvance(currentValue)}
              disabled={!canAdvance}
              className="self-end rounded-full bg-roast-red px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper transition-transform enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLast ? "Get roasted" : "Next"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-xs text-smoke/30">
        {resumeText.length} characters of material loaded.
      </p>
    </div>
  );
}
