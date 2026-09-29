"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { cn } from "@/lib/cn";

interface CoinLottieProps {
  className?: string;
  speed?: number;
  /** When provided, the player only renders inside this CSS prefers-reduced-motion gate. */
}

/**
 * Plays /public/sui-crypto-coin.json. Fetches the JSON on mount so it stays
 * out of the JS bundle (144 KB). Respects prefers-reduced-motion by pausing.
 */
export function CoinLottie({ className, speed = 1 }: CoinLottieProps) {
  const [data, setData] = useState<object | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    let aborted = false;
    fetch("/sui-crypto-coin.json")
      .then((r) => r.json())
      .then((json) => {
        if (!aborted) setData(json);
      })
      .catch(() => {
        // Silently fall back — caller renders a placeholder if needed.
      });
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    const ref = lottieRef.current;
    if (!ref) return;
    ref.setSpeed(speed);
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      ref.stop();
    }
  }, [data, speed]);

  if (!data) {
    return <div className={cn("h-full w-full", className)} aria-hidden />;
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={data}
      loop
      autoplay
      className={cn("h-full w-full", className)}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
