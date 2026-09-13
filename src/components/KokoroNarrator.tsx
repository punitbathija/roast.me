"use client";

import { useEffect, useRef, useState } from "react";

type Status =
  | "idle"
  | "loading-model"
  | "generating"
  | "playing"
  | "paused"
  | "error";

type WorkerOutgoing =
  | { type: "device"; device: "webgpu" | "wasm" }
  | { type: "progress"; progress?: number; status: string }
  | { type: "ready"; voices: string[] }
  | { type: "result"; id: string; wav: ArrayBuffer }
  | { type: "error"; id?: string; message: string };

const DEFAULT_VOICE = "af_heart";

export default function KokoroNarrator({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState("");
  const [device, setDevice] = useState<"webgpu" | "wasm" | null>(null);
  const [voices, setVoices] = useState<string[]>([]);
  const [voice, setVoice] = useState(DEFAULT_VOICE);
  const [errorMessage, setErrorMessage] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const cachedAudioRef = useRef<{ text: string; voice: string; url: string } | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL("../workers/kokoro-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.addEventListener("message", (event: MessageEvent<WorkerOutgoing>) => {
      const msg = event.data;

      if (msg.type === "device") {
        setDevice(msg.device);
      } else if (msg.type === "progress") {
        setProgress(msg.progress ?? null);
        setProgressLabel(msg.status);
      } else if (msg.type === "ready") {
        setVoices(msg.voices);
      } else if (msg.type === "result" && msg.id === pendingIdRef.current) {
        const blob = new Blob([msg.wav], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        cachedAudioRef.current = { text, voice, url };

        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
        setStatus("playing");
      } else if (msg.type === "error" && (!msg.id || msg.id === pendingIdRef.current)) {
        setErrorMessage(msg.message);
        setStatus("error");
      }
    });

    workerRef.current = worker;
    return worker;
  };

function sanitizeForSpeech(text: string): string {
  return text
    .replace(/\n+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
  
  const play = () => {
    setErrorMessage("");

    if (cachedAudioRef.current?.text === text && cachedAudioRef.current?.voice === voice) {
      if (audioRef.current) {
        audioRef.current.src = cachedAudioRef.current.url;
        audioRef.current.play();
      }
      setStatus("playing");
      return;
    }

    setStatus("loading-model");
    setProgress(null);
    setProgressLabel("Warming up the mic…");

    const worker = ensureWorker();
    const id = crypto.randomUUID();
    pendingIdRef.current = id;
    setStatus("generating");
    worker.postMessage({ type: "generate", id, text: sanitizeForSpeech(text), voice });
  };

  const pause = () => {
    audioRef.current?.pause();
    setStatus("paused");
  };

  const resume = () => {
    audioRef.current?.play();
    setStatus("playing");
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus("idle");
  };

  const busy = status === "loading-model" || status === "generating";

  return (
    <div className="flex flex-col items-center gap-3">
      <audio ref={audioRef} onEnded={() => setStatus("idle")} className="hidden" />

      <div className="flex items-center gap-3">
        {(status === "idle" || status === "error") && (
          <button
            onClick={play}
            className="rounded-full bg-spotlight px-5 py-2 text-xs font-semibold uppercase tracking-widest text-ink transition-transform hover:scale-105"
          >
            🎙️ Hear the roast (AI voice)
          </button>
        )}

        {busy && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-paper/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-roast-red transition-all"
                style={{ width: progress != null ? `${progress}%` : "30%" }}
              />
            </div>
            <span className="text-xs text-smoke/60">
              {status === "loading-model" ? progressLabel : "Recording the bit…"}
            </span>
          </div>
        )}

        {status === "playing" && (
          <>
            <button onClick={pause} className="rounded-full bg-spotlight px-5 py-2 text-xs font-semibold uppercase tracking-widest text-ink">
              Pause
            </button>
            <button onClick={stop} className="text-xs font-medium uppercase tracking-widest text-smoke/60 hover:text-smoke">
              Stop
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button onClick={resume} className="rounded-full bg-spotlight px-5 py-2 text-xs font-semibold uppercase tracking-widest text-ink">
              Resume
            </button>
            <button onClick={stop} className="text-xs font-medium uppercase tracking-widest text-smoke/60 hover:text-smoke">
              Stop
            </button>
          </>
        )}
      </div>

      {voices.length > 1 && !busy && (
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="rounded-full border border-smoke/20 bg-transparent px-3 py-1 text-xs text-smoke"
        >
          {voices.map((v) => (
            <option key={v} value={v} className="text-ink">
              {v}
            </option>
          ))}
        </select>
      )}

      {status === "error" && (
        <p className="max-w-xs text-center text-xs text-roast-red">
          Couldn&apos;t generate audio: {errorMessage}
        </p>
      )}

      {device && (
        <p className="text-[10px] uppercase tracking-widest text-smoke/30">
          running on-device via {device === "webgpu" ? "WebGPU" : "WASM"} — free, no server
        </p>
      )}
    </div>
  );
}
