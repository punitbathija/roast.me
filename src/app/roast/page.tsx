"use client";

import { useState } from "react";
import Link from "next/link";
import QuestionFlow from "@/components/QuestionFlow";
import { useSessionStorage } from "@/lib/useSessionStorage";
import type { RoastAnswer } from "@/app/api/roast/route";

export default function RoastPage() {
  const fileName = useSessionStorage("roastme:fileName");
  const resumeText = useSessionStorage("roastme:resumeText");
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (answers: RoastAnswer[]) => {
    setError(null);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong backstage.");
        return;
      }

      sessionStorage.setItem("roastme:roast", data.roast);
      window.location.href = "/result";
    } catch {
      setError("Couldn't reach the stage. Check your connection and try again.");
    }
  };

  if (!resumeText) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="font-display text-sm tracking-[0.4em] text-spotlight">
          HOLD ON
        </span>
        <h1 className="font-display text-4xl text-paper sm:text-5xl">
          No resume in the wings
        </h1>
        <Link
          href="/"
          className="mt-2 rounded-full bg-roast-red px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper"
        >
          Go upload one
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <span className="font-display text-sm tracking-[0.4em] text-spotlight">
          BACKSTAGE INTERVIEW
        </span>
        {fileName && (
          <p className="mt-1 text-xs text-smoke/50">based on {fileName}</p>
        )}
      </div>

      <QuestionFlow resumeText={resumeText} onComplete={handleComplete} />

      {error && (
        <p className="max-w-sm text-center text-sm text-roast-red">{error}</p>
      )}
    </main>
  );
}
