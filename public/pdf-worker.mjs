// iOS Safari (several current versions) lacks Promise.try / Promise.withResolvers,
// which recent pdfjs-dist worker builds rely on. Polyfill before loading the
// real worker so it doesn't silently fail to initialize on iPhone.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
if (typeof Promise.try !== "function") {
  Promise.try = function (fn, ...args) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

await import("https://unpkg.com/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs");