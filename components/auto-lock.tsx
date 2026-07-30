"use client";

import { useEffect, useRef, useState } from "react";
import type { FrontendVersion } from "@/lib/types";

const DURATION_MS = 60_000;
const TICK_MS = 250;

/**
 * WCAG 2.2.1 (Timing Adjustable) escape hatch for the 60s auto-redirect:
 * a visible countdown, pausable by interacting with the console or
 * backgrounding the tab, and permanently cancellable via [ HOLD ].
 *
 * Tracks `remainingMs` and decrements it by the real wall-clock delta
 * between ticks (rather than assuming each tick is exactly TICK_MS) so
 * background-tab timer throttling can't make the redirect overshoot —
 * and while paused, the delta simply isn't applied, so no elapsed time
 * is ever double-counted on resume.
 */
export function AutoLock({
  target,
  targetIndex,
  paused,
}: {
  target: FrontendVersion;
  targetIndex: number;
  paused: boolean;
}) {
  // Starts null so the server-rendered and first client-rendered HTML
  // match exactly — the interval below is what starts the clock.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [tabHidden, setTabHidden] = useState(
    () => typeof document !== "undefined" && document.visibilityState === "hidden",
  );

  const effectivePaused = paused || tabHidden;
  const pausedRef = useRef(effectivePaused);
  const heldRef = useRef(held);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    pausedRef.current = effectivePaused;
    // Re-anchor the reference tick so the time spent paused is never
    // subtracted once the countdown resumes.
    lastTickRef.current = Date.now();
  }, [effectivePaused]);

  useEffect(() => {
    heldRef.current = held;
  }, [held]);

  useEffect(() => {
    const onVisibilityChange = () =>
      setTabHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      if (heldRef.current || pausedRef.current) return;
      setRemainingMs((current) =>
        Math.max(0, (current ?? DURATION_MS) - (now - last)),
      );
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (held || remainingMs === null || remainingMs > 0) return;
    window.location.assign(target.url);
  }, [remainingMs, held, target.url]);

  if (remainingMs === null) {
    return (
      <p className="mt-4 border-t border-green-dim/40 pt-3 text-[11px] uppercase tracking-[0.05em] text-text-muted">
        AUTO-LOCK: STANDBY
      </p>
    );
  }

  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-green-dim/40 pt-3 text-[11px] uppercase tracking-[0.05em]">
      <p className="text-text-muted">
        {held ? (
          "AUTO-LOCK: HELD"
        ) : (
          <>
            AUTO-LOCK: CH {String(targetIndex).padStart(2, "0")} →{" "}
            <span className="text-green-mid">{target.title}</span> IN{" "}
            <span className="tabular-nums text-green-bright">{seconds}S</span>
          </>
        )}
      </p>
      {held ? null : (
        <button
          type="button"
          onClick={() => setHeld(true)}
          className="shrink-0 border border-green-dim px-3 py-1 text-green-mid hover:border-green-bright hover:text-green-bright"
        >
          [ HOLD ]
        </button>
      )}
    </div>
  );
}
