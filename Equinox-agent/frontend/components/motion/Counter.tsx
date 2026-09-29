"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface CounterProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  compact?: boolean;
}

export function Counter({
  to,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  compact = false,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = (v: number) => {
      if (compact) {
        return new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(v);
      }
      return v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };
    if (reduced) {
      el.textContent = `${prefix}${format(to)}${suffix}`;
      return;
    }
    const obj = { val: 0 };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(obj, {
              val: to,
              duration,
              ease: "expo.out",
              onUpdate: () => {
                el.textContent = `${prefix}${format(obj.val)}${suffix}`;
              },
            });
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, prefix, suffix, decimals, compact]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
