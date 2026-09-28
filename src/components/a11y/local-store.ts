"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed external store. Reads are wrapped in try/catch
 * (private mode, blocked storage) and the server snapshot is always null,
 * so SSR and hydration stay consistent.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable: preference just won't persist
  }
  listeners.forEach((l) => l());
}

export function useLocalValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readLocal(key),
    () => null,
  );
}

const noop = () => () => {};
/** True after hydration on the client; false during SSR. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
