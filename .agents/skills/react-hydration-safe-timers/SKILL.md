---
name: react-hydration-safe-timers
description: Build countdowns, auto-redirects, polling intervals, timeouts, or any other timer-driven UI in a React 19 / Next.js client component. Use this whenever a component needs to track elapsed or remaining time client-side — especially if it must (a) render identically on the server and the first client paint (no hydration mismatch), (b) stay accurate even when the browser throttles setInterval in a backgrounded tab, and/or (c) be pausable and resumable without losing or double-counting time. Also consult this skill whenever ESLint reports `react-hooks/set-state-in-effect` on a `useEffect` that calls `setState` to "start" a value on mount (a very common pattern for client-only initialization, e.g. the same shape used by next-themes) — that lint rule is part of the React Compiler-era eslint-plugin-react-hooks and the fix is a specific restructuring, not a suppression.
---

# Hydration-safe, drift-resistant, pausable timers in React

A worked pattern for client-side timers (countdowns, auto-redirects, polling,
timeouts) that satisfies four constraints simultaneously. Most timer code
online only handles the first one or two; the other two are what actually
break in production.

## The four constraints

1. **Hydration-safe.** The server has no wall clock context for "time left."
   If the initial render shows a real countdown value, the server-rendered
   HTML and the first client render (before any effect has run) won't match,
   and React logs a hydration error.
2. **Drift-resistant.** `setInterval` is not reliable in a backgrounded tab —
   browsers throttle it to save battery, sometimes to once a minute or less.
   A timer that assumes "N ticks have passed, so N × interval ms have
   elapsed" will systematically undercount elapsed time and overshoot its
   deadline once the tab regains focus.
3. **Pausable without banking error.** If the timer freezes while paused,
   naively resuming it must not silently consume the paused duration as if
   it had counted down, and must not require a separate "how long were we
   paused" accumulator to get this right.
4. **Compliant with `react-hooks/set-state-in-effect`.** The obvious way to
   start a client-only value — `useState(null)` then
   `useEffect(() => setValue(x), [])` — is exactly what this newer lint rule
   flags, even though it's the standard hydration-safe idiom (the same shape
   `next-themes` uses to avoid a light/dark flash). The rule isn't wrong to
   flag it, though: the fix it's nudging you toward is more robust anyway.

## The technique

### 1. Null-until-mounted state, not a computed initial value

```tsx
const [remainingMs, setRemainingMs] = useState<number | null>(null);
```

Server and the first client render both see `null` and render the same
placeholder ("STANDBY", a skeleton, whatever). This alone satisfies
constraint 1. Never seed this from `Date.now()` in the initializer — that
still runs during SSR and will differ from the eventual client value.

### 2. Never call setState directly in an effect body — only from inside a callback the effect sets up

This is the fix for constraint 4, and it's not a workaround — it's a
genuinely different (and better) structure. The lint rule's own guidance is
to "call setState in a callback function when external state changes." A
`setInterval` tick or a DOM event listener both qualify as that callback; a
bare effect body does not, because nothing "changed" yet — you're just
initializing.

```tsx
// ❌ Flagged, and also the thing that makes constraint 2 hard to fix later:
useEffect(() => {
  setRemainingMs(DURATION_MS); // synchronous setState in effect body
}, []);

// ✅ Set up a subscription; let its callback own the setState calls:
useEffect(() => {
  lastTickRef.current = Date.now();
  const id = window.setInterval(() => {
    const now = Date.now();
    const last = lastTickRef.current ?? now;
    lastTickRef.current = now;
    if (pausedRef.current) return;
    setRemainingMs((current) =>
      Math.max(0, (current ?? DURATION_MS) - (now - last)),
    );
  }, TICK_MS);
  return () => window.clearInterval(id);
}, []); // deps stay empty — see refs below for why this doesn't go stale
```

Because the first tick fires `TICK_MS` after mount, `remainingMs` stays
`null` (placeholder still showing) for one tick, then flips to a real number.
That's a fine, brief transition — not a hydration mismatch, since it happens
entirely after mount.

The same fix applies to any "read a client-only global once" case, e.g.
`document.visibilityState`. If you need it correct at first paint (not just
eventually-correct after an effect), use a **lazy `useState` initializer**
instead of an effect — the initializer runs during render on both server and
client, is allowed to defensively check for client-only globals, and isn't
an effect-body setState call:

```tsx
const [tabHidden, setTabHidden] = useState(
  () => typeof document !== "undefined" && document.visibilityState === "hidden",
);
useEffect(() => {
  const onChange = () => setTabHidden(document.visibilityState === "hidden");
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}, []);
```

### 3. Decrement by real wall-clock delta, not by assumed tick length

This is what solves constraint 2. Capture `Date.now()` at every tick and
subtract `now - last`, instead of subtracting a fixed `TICK_MS` per fire. If
the browser throttles a backgrounded tab so ticks fire every 30s instead of
every 250ms, the delta for that tick is just correctly reported as ~30000ms
— the countdown still lands on the right value instead of overshooting by
however many ticks got skipped. You get this correctness for free; you don't
need `requestAnimationFrame`, Web Workers, or any other trick to "fix"
`setInterval` throttling.

### 4. Pause via a ref-mirrored flag, and re-anchor the tick reference on every pause/resume transition

Constraint 3's trap is double-counting: if you stop the interval entirely on
pause and restart it on resume, or if you track a separate "paused duration"
accumulator, it's easy to get the arithmetic wrong. The simpler fix: keep the
interval running the whole time, mirror the pause boolean into a `ref` so
the interval callback (created once, empty deps) always reads the current
value without needing to be recreated:

```tsx
const pausedRef = useRef(paused);
useEffect(() => {
  pausedRef.current = paused;
  // Re-anchor so the elapsed time *while paused* is never subtracted
  // once the countdown resumes — no separate accumulator needed.
  lastTickRef.current = Date.now();
}, [paused]);
```

When paused flips, `lastTickRef` jumps forward to "now." The next tick after
resuming computes a small, correct delta from that fresh anchor — the gap
spent paused simply isn't part of any delta calculation, so it's never
subtracted. The interval callback itself just early-returns when
`pausedRef.current` is true, without touching `remainingMs`.

## Minimal reusable template

A generic version of the pattern (adapt the render/expiry logic to your
case — this is the shape, not a drop-in component):

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function useCountdown({
  durationMs,
  tickMs = 250,
  paused = false,
  onExpire,
}: {
  durationMs: number;
  tickMs?: number;
  paused?: boolean;
  onExpire?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const pausedRef = useRef(paused);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    lastTickRef.current = Date.now();
  }, [paused]);

  useEffect(() => {
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      if (pausedRef.current) return;
      setRemainingMs((current) =>
        Math.max(0, (current ?? durationMs) - (now - last)),
      );
    }, tickMs);
    return () => window.clearInterval(id);
    // Intentionally empty: durationMs/tickMs are read once per mount via
    // closure; changing them mid-countdown isn't a supported use case here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remainingMs === null || remainingMs > 0) return;
    onExpire?.();
  }, [remainingMs, onExpire]);

  return remainingMs; // null until mounted, then counts down to 0
}
```

Callers add their own "held/cancelled forever" boolean on top if the timer
needs a permanent stop (see the real example below) — keep that as a
separate `held` piece of state gating the *effect* of expiry (e.g. don't
navigate/fire the callback), not as another thing this hook needs to know
about.

## Worked example

`components/auto-lock.tsx` in this repo (`port-landing`) is a full, in-context
example: a 60-second auto-redirect countdown that's pausable (hover/focus on
a list) and permanently cancellable via a "HOLD" button — the accessibility
escape hatch required by WCAG 2.2.1 (Timing Adjustable) for any UI that
changes state on a timer without user action. Read it directly for the fully
worked version, including how `held` composes with the paused-ref mechanism
above.
