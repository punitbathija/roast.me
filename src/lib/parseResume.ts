"use client";

// Client-side PDF text extraction using pdf.js.
// The worker is loaded from a CDN matching the installed pdfjs-dist version,
// so we don't have to fight Next.js/webpack over bundling the worker file.

// WebKit (Safari, and Chrome/Firefox on iOS — same engine) didn't support
// async iteration over ReadableStream until Safari 26.4. pdf.js's
// getTextContent() relies on `for await...of` over a ReadableStream
// internally, which throws "undefined is not a function" on older WebKit.
// Feature-detected polyfill, no-op on browsers that already support it.
if (
  typeof ReadableStream !== "undefined" &&
  !(ReadableStream.prototype as any)[Symbol.asyncIterator]
) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = function () {
    const reader = this.getReader();
    return {
      next() {
        return reader.read();
      },
      return(value: unknown) {
        reader.releaseLock();
        return Promise.resolve({ done: true, value });
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
}

export type ParsedResume = {
  text: string;
  pageCount: number;
};

let workerConfigured = false;

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf-worker.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}

export async function extractTextFromPdf(file: File): Promise<ParsedResume> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n\n").replace(/\s+/g, " ").trim();

  return { text, pageCount: pdf.numPages };
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
