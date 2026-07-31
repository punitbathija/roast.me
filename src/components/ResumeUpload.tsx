"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { extractTextFromPdf, isPdfFile } from "@/lib/parseResume";

type Status = "idle" | "reading" | "ready" | "error";

export default function ResumeUpload() {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [resumeText, setResumeText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!isPdfFile(file)) {
      setStatus("error");
      setErrorMessage("That's not a PDF. We roast resumes, not mystery files.");
      return;
    }

    setStatus("reading");
    setFileName(file.name);
    setErrorMessage("");

    try {
      const { text } = await extractTextFromPdf(file);
      if (!text || text.length < 20) {
        setStatus("error");
        setErrorMessage("Couldn't find any real text in there. Scanned image? Try a real PDF export.");
        return;
      }
      setResumeText(text);
      setWordCount(text.split(/\s+/).filter(Boolean).length);
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorMessage("That PDF fought back. Try a different file.");
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setWordCount(0);
    setResumeText("");
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleTakeStage = () => {
    // Next step (sassy questions) will read this from wherever we end up
    // persisting it — sessionStorage is enough for now, no backend yet.
    sessionStorage.setItem("roastme:resumeText", resumeText);
    sessionStorage.setItem("roastme:fileName", fileName);
    window.location.href = "/roast";
  };

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Spotlight cone */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[560px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--spotlight) 0%, transparent 65%)",
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-sm border-2 border-dashed transition-colors duration-200 ${
          isDragging ? "border-roast-red" : "border-spotlight-dim/60"
        } bg-paper p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-10`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onInputChange}
          className="sr-only"
          id="resume-input"
        />

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <span className="font-display text-3xl tracking-wide text-ink sm:text-4xl">
                Drop your resume on stage
              </span>
              <span className="text-sm text-ink/60">
                PDF only. We read it so you don&apos;t have to relive it.
              </span>
              <button
                type="button"
                onClick={openFilePicker}
                className="mt-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest text-paper transition-transform hover:scale-105"
              >
                Choose file
              </button>
            </motion.div>
          )}

          {status === "reading" && (
            <motion.div
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  className="absolute inset-y-0 w-1/3 rounded-full bg-roast-red"
                  animate={{ x: ["-40%", "180%"] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                />
              </div>
              <span className="font-display text-2xl tracking-wide text-ink">
                Reading {fileName}&hellip;
              </span>
              <span className="text-sm text-ink/60">
                Gathering material. This won&apos;t be kind.
              </span>
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-2 text-center"
            >
              <motion.span
                initial={{ rotate: -8, scale: 1.4, opacity: 0 }}
                animate={{ rotate: -8, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="rounded-sm border-4 border-roast-red px-4 py-1 font-display text-xl tracking-[0.2em] text-roast-red"
              >
                LOADED
              </motion.span>
              <span className="font-display text-2xl tracking-wide text-ink">
                {fileName}
              </span>
              <span className="text-sm text-ink/60">
                {wordCount} words of material to work with.
              </span>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={handleTakeStage}
                  className="rounded-full bg-roast-red px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper transition-transform hover:scale-105"
                >
                  Take the stage
                </button>
                <button
                  onClick={reset}
                  className="text-xs font-medium uppercase tracking-widest text-ink/50 hover:text-ink"
                >
                  Different file
                </button>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-4 text-center"
            >
              <span className="font-display text-2xl tracking-wide text-roast-red">
                Nope.
              </span>
              <span className="text-sm text-ink/70">{errorMessage}</span>
              <button
                onClick={reset}
                className="mt-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest text-paper"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
