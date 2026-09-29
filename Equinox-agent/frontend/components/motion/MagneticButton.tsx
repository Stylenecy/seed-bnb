"use client";

import { forwardRef, useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intensity?: number;
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton({ children, className, intensity = 0.25, ...props }) {
    const innerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, {
          x: x * intensity,
          y: y * intensity,
          duration: 0.5,
          ease: "power3.out",
        });
      };
      const onLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    }, [intensity]);

    return (
      <button
        ref={innerRef}
        className={cn("will-change-transform", className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
