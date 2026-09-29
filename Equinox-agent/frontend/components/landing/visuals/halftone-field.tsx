"use client";

import { useEffect, useRef } from "react";

type Block = {
  x: number;
  y: number;
  w: number; // cells
  h: number; // cells
  base: number; // base brightness 0..1
  speed: number;
  phase: number;
  drift: { dx: number; dy: number };
  cellVar: Float32Array; // per-cell variance 0..1
};

const CELL = 5; // pixel pitch
const CELL_FILL = 3; // size of filled block per cell (px)

export function HalftoneField() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let blocks: Block[] = [];

    function makeBlock(x: number, y: number, base: number): Block {
      const w = 6 + Math.floor(Math.random() * 38);
      const h = 3 + Math.floor(Math.random() * 14);
      const cellVar = new Float32Array(w * h);
      for (let i = 0; i < cellVar.length; i++) {
        cellVar[i] = 0.45 + Math.random() * 0.55;
      }
      return {
        x,
        y,
        w,
        h,
        base,
        speed: 0.0003 + Math.random() * 0.0006,
        phase: Math.random() * Math.PI * 2,
        drift: {
          dx: (Math.random() - 0.5) * 0.04,
          dy: (Math.random() - 0.5) * 0.015,
        },
        cellVar,
      };
    }

    function regenerate() {
      blocks = [];
      // Density target — more blocks for bigger screens
      const target = Math.floor((W * H) / 24000) + 20;
      for (let i = 0; i < target; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        // Brighter clusters around middle band; dimmer at top/bottom
        const yNorm = y / H;
        const centerBoost = 1 - Math.abs(yNorm - 0.5) * 1.4;
        const base = 0.06 + Math.random() * 0.34 * Math.max(0.15, centerBoost);
        blocks.push(makeBlock(x, y, base));
      }
    }

    function sizeUp() {
      const rect = wrap!.getBoundingClientRect();
      W = Math.max(360, rect.width);
      H = Math.max(320, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      regenerate();
    }

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);

      for (const b of blocks) {
        // drift
        b.x += b.drift.dx;
        b.y += b.drift.dy;
        // wrap
        const bw = b.w * CELL;
        const bh = b.h * CELL;
        if (b.x < -bw) b.x = W + 20;
        else if (b.x > W + 20) b.x = -bw;
        if (b.y < -bh) b.y = H + 20;
        else if (b.y > H + 20) b.y = -bh;

        const pulse = 0.55 + 0.45 * Math.sin(t * b.speed + b.phase);
        const baseAlpha = b.base * pulse;

        for (let yy = 0; yy < b.h; yy++) {
          for (let xx = 0; xx < b.w; xx++) {
            const v = b.cellVar[yy * b.w + xx];
            const alpha = Math.min(0.85, baseAlpha * v * 1.8);
            ctx!.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
            ctx!.fillRect(b.x + xx * CELL, b.y + yy * CELL, CELL_FILL, CELL_FILL);
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    sizeUp();
    const ro = new ResizeObserver(sizeUp);
    ro.observe(wrap);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
