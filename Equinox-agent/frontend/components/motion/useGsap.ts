"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useGsapContext<T extends HTMLElement = HTMLDivElement>(
  setup: (ctx: { gsap: typeof gsap; root: T }) => void | (() => void),
  deps: unknown[] = [],
) {
  const ref = useRef<T | null>(null);

  useIsoLayoutEffect(() => {
    if (!ref.current) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(ref.current.querySelectorAll("[data-anim]"), { clearProps: "all" });
      return;
    }
    const ctx = gsap.context(() => {
      setup({ gsap, root: ref.current as T });
    }, ref);
    return () => ctx.revert();
  }, deps);

  return ref;
}
