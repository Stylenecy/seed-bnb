"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  letter?: string;
  className?: string;
  stride?: number;
  arrowSize?: number;
};

type Arrow = {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  nextSwitch: number;
  alpha: number;
};

const DIRECTIONS = [
  0,
  Math.PI / 4,
  Math.PI / 2,
  (3 * Math.PI) / 4,
  Math.PI,
  (5 * Math.PI) / 4,
  (3 * Math.PI) / 2,
  (7 * Math.PI) / 4,
];

function pickDir(current: number) {
  let next = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  if (Math.abs(next - current) < 0.01) {
    next = DIRECTIONS[(DIRECTIONS.indexOf(next) + 2) % DIRECTIONS.length];
  }
  return next;
}

function shortestDelta(from: number, to: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function ArrowField({
  letter = "A",
  className,
  stride = 11,
  arrowSize = 5.5,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let arrows: Arrow[] = [];
    let raf = 0;
    let running = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let widthCss = 0;
    let heightCss = 0;

    function sample() {
      const rect = wrap!.getBoundingClientRect();
      widthCss = Math.max(280, rect.width);
      heightCss = Math.max(280, rect.height);

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(widthCss * dpr);
      canvas!.height = Math.floor(heightCss * dpr);
      canvas!.style.width = `${widthCss}px`;
      canvas!.style.height = `${heightCss}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      off.width = Math.floor(widthCss);
      off.height = Math.floor(heightCss);
      const octx = off.getContext("2d");
      if (!octx) return;

      octx.fillStyle = "#000";
      octx.fillRect(0, 0, off.width, off.height);
      octx.fillStyle = "#fff";
      octx.textBaseline = "middle";
      octx.textAlign = "center";
      const fontSize = Math.floor(heightCss * 1.05);
      octx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
      octx.fillText(letter, off.width / 2, off.height / 2 + fontSize * 0.02);

      const img = octx.getImageData(0, 0, off.width, off.height).data;

      const next: Arrow[] = [];
      const now = performance.now();
      for (let y = stride / 2; y < off.height; y += stride) {
        for (let x = stride / 2; x < off.width; x += stride) {
          const idx = (Math.floor(y) * off.width + Math.floor(x)) * 4;
          const r = img[idx];
          if (r > 140) {
            const initial =
              DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            next.push({
              x,
              y,
              angle: initial,
              targetAngle: initial,
              speed: 0.04 + Math.random() * 0.07,
              nextSwitch: now + 800 + Math.random() * 4200,
              alpha: 0.35 + Math.random() * 0.5,
            });
          }
        }
      }
      arrows = next;
    }

    function drawArrow(a: Arrow) {
      ctx!.save();
      ctx!.translate(a.x, a.y);
      ctx!.rotate(a.angle);
      ctx!.strokeStyle = `rgba(220, 224, 240, ${a.alpha})`;
      ctx!.lineWidth = 1;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      const s = arrowSize;
      ctx!.beginPath();
      ctx!.moveTo(-s, 0);
      ctx!.lineTo(s, 0);
      ctx!.moveTo(s, 0);
      ctx!.lineTo(s - s * 0.55, -s * 0.55);
      ctx!.moveTo(s, 0);
      ctx!.lineTo(s - s * 0.55, s * 0.55);
      ctx!.stroke();
      ctx!.restore();
    }

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, widthCss, heightCss);

      for (const a of arrows) {
        if (t >= a.nextSwitch) {
          a.targetAngle = pickDir(a.targetAngle);
          a.nextSwitch = t + 1200 + Math.random() * 4800;
        }
        const d = shortestDelta(a.angle, a.targetAngle);
        a.angle += d * a.speed;
        drawArrow(a);
      }

      raf = requestAnimationFrame(frame);
    }

    function staticDraw() {
      ctx!.clearRect(0, 0, widthCss, heightCss);
      for (const a of arrows) drawArrow(a);
    }

    sample();
    if (prefersReducedMotion) {
      staticDraw();
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      sample();
      if (prefersReducedMotion) staticDraw();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [letter, stride, arrowSize]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
