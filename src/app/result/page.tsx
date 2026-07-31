"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSessionStorage } from "@/lib/useSessionStorage";

export default function ResultPage() {
  const roast = useSessionStorage("roastme:roast");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return "speechSynthesis" in window;
  });

  const speakRoast = () => {
    if (!roast || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(roast.replace(/\n+/g, ". "));
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.12;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  if (!roast) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="font-display text-sm tracking-[0.4em] text-spotlight">
          EMPTY STAGE
        </span>
        <h1 className="font-display text-4xl text-paper sm:text-5xl">
          Nothing to show
        </h1>
        <Link
          href="/"
          className="mt-2 rounded-full bg-roast-red px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper"
        >
          Start over
        </Link>
      </main>
    );
  }

  const paragraphs = roast.split(/\n+/).filter(Boolean);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <span className="font-display text-sm tracking-[0.4em] text-spotlight">
        THE VERDICT
      </span>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex max-w-xl flex-col gap-4 rounded-sm bg-paper p-8 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-10"
      >
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed sm:text-base">
            {p}
          </p>
        ))}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        {speechSupported && (
          <button
            type="button"
            onClick={isSpeaking ? () => window.speechSynthesis.cancel() : speakRoast}
            className="rounded-full border border-ink/20 bg-paper px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink"
          >
            {isSpeaking ? "Stop the drama" : "Hear the verdict"}
          </button>
        )}
        <Link
          href="/"
          className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper"
        >
          Roast another
        </Link>
      </div>
      <p className="max-w-sm text-center text-xs text-smoke/50">
        Sign in to save this one — coming soon.
      </p>
    </main>
  );
}
