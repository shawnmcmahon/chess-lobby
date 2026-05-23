import { useEffect, useState } from "react";

/**
 * Returns a "live" timestamp that updates while `active` is true.
 * Used by clock components to re-render every `intervalMs` milliseconds.
 *
 * Initialized lazily to `Date.now()` so consumers can render correct elapsed
 * time on first paint.
 */
export function useNow(active: boolean, intervalMs = 200): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
