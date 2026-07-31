"use client";

import { useSyncExternalStore } from "react";

// Reads a sessionStorage value without causing a hydration mismatch.
// The server (and the client's first hydration pass) always sees `null`;
// React then reconciles to the real client value right after mount.
// This is the pattern React recommends for browser-only external state —
// unlike reading it in a useState initializer or a useEffect setState,
// it doesn't fight the hydration algorithm or trip the
// react-hooks/set-state-in-effect rule.

function subscribe() {
  return () => {};
}

export function useSessionStorage(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(key),
    () => null
  );
}
