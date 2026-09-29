"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 to `target` on mount and whenever `target` changes.
 * Uses easeOutCubic and rAF — no external deps.
 */
export function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    let startedAt = 0;

    function step(now: number) {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const v = from + (target - from) * eased;
      setValue(t === 1 ? target : v);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}
