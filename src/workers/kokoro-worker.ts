// Runs Kokoro-82M entirely in the browser — no server, no per-request cost,
// regardless of traffic. Lives in its own module worker so model loading and
// inference don't block the UI thread, and so bundler quirks around ONNX/WASM
// stay isolated from the rest of the app.
//
// Model weights are fetched from Hugging Face and cached by the browser
// (Cache API), so this only downloads once per device, not once per roast.

import { KokoroTTS } from "kokoro-js";
import type { ProgressInfo } from "@huggingface/transformers";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

type KokoroVoice = NonNullable<Parameters<KokoroTTS["generate"]>[1]>["voice"];

type IncomingMessage =
  | { type: "init" }
  | { type: "generate"; id: string; text: string; voice: string };

type OutgoingMessage =
  | { type: "device"; device: "webgpu" | "wasm" }
  | { type: "progress"; progress?: number; status: string }
  | { type: "ready"; voices: string[] }
  | { type: "result"; id: string; wav: ArrayBuffer }
  | { type: "error"; id?: string; message: string };

let ttsPromise: ReturnType<typeof loadModel> | null = null;

async function detectDevice(): Promise<"webgpu" | "wasm"> {
  const gpu = (globalThis as unknown as { navigator?: { gpu?: unknown } })
    .navigator?.gpu;
  return gpu ? "webgpu" : "wasm";
}

async function loadModel() {
  const device = await detectDevice();
  post({ type: "device", device });

  const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: device === "webgpu" ? "fp32" : "q8",
    device,
    progress_callback: (progress: ProgressInfo) => {
      if (progress.status === "progress") {
        post({ type: "progress", progress: progress.progress, status: progress.file });
      } else if ("file" in progress) {
        post({ type: "progress", status: `${progress.status}: ${progress.file}` });
      }
    },
  });

  post({ type: "ready", voices: Object.keys(tts.voices) });
  return tts;
}

function post(message: OutgoingMessage) {
  (self as unknown as Worker).postMessage(message);
}

self.addEventListener("message", async (event: MessageEvent<IncomingMessage>) => {
  const msg = event.data;

  if (msg.type === "init") {
    ttsPromise ??= loadModel();
    try {
      await ttsPromise;
    } catch (err) {
      post({ type: "error", message: (err as Error).message });
    }
    return;
  }

  if (msg.type === "generate") {
    try {
      ttsPromise ??= loadModel();
      const tts = await ttsPromise;
      const audio = await tts.generate(msg.text, {
        voice: msg.voice as KokoroVoice,
      });
      const wav = audio.toWav();
      post({ type: "result", id: msg.id, wav });
    } catch (err) {
      post({ type: "error", id: msg.id, message: (err as Error).message });
    }
  }
});