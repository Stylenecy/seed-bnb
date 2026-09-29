"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function Toggle({
  defaultOn,
  onChange,
  disabled,
  label,
}: {
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [on, setOn] = useState(!!defaultOn);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        const v = !on;
        setOn(v);
        onChange?.(v);
      }}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
        on
          ? "bg-[var(--color-accent)]"
          : "bg-white/[0.08] border border-white/[0.08]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-all",
          on ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}
