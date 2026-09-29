"use client";

import { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";

export function DepositChart() {
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

    function sizeUp() {
      const r = wrap!.getBoundingClientRect();
      W = Math.max(240, r.width);
      H = Math.max(160, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);

      ctx!.strokeStyle = "rgba(255, 255, 255, 0.10)";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 4]);
      ctx!.beginPath();
      ctx!.moveTo(20, H * 0.32);
      ctx!.lineTo(W - 20, H * 0.32);
      ctx!.stroke();
      ctx!.setLineDash([]);

      // Vertically center the chart inside the canvas — baseline pulled up
      // from 0.78 → 0.66 so the wave + fill block reads as centered.
      const baseline = H * 0.66;
      const amp = H * 0.32;
      const phase = t / 6200;
      const padX = 20;

      ctx!.beginPath();
      ctx!.moveTo(padX, H);
      ctx!.lineTo(padX, baseline);
      const step = 3;
      for (let x = padX; x <= W - padX; x += step) {
        const u = (x - padX) / (W - padX * 2);
        const y =
          baseline -
          amp *
            (0.55 +
              0.35 * Math.sin(u * Math.PI * 1.6 + phase) +
              0.18 * Math.sin(u * Math.PI * 4 + phase * 1.4) +
              0.08 * Math.sin(u * Math.PI * 9 + phase * 2.1));
        ctx!.lineTo(x, Math.min(baseline, y));
      }
      ctx!.lineTo(W - padX, H);
      ctx!.closePath();

      const fillGrad = ctx!.createLinearGradient(0, H * 0.25, 0, H);
      fillGrad.addColorStop(0, "rgba(108, 242, 204, 0.28)");
      fillGrad.addColorStop(0.5, "rgba(108, 242, 204, 0.08)");
      fillGrad.addColorStop(1, "rgba(108, 242, 204, 0.02)");
      ctx!.fillStyle = fillGrad;
      ctx!.fill();

      ctx!.beginPath();
      for (let x = padX; x <= W - padX; x += step) {
        const u = (x - padX) / (W - padX * 2);
        const y =
          baseline -
          amp *
            (0.55 +
              0.35 * Math.sin(u * Math.PI * 1.6 + phase) +
              0.18 * Math.sin(u * Math.PI * 4 + phase * 1.4) +
              0.08 * Math.sin(u * Math.PI * 9 + phase * 2.1));
        if (x === padX) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(108, 242, 204, 0.88)";
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

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
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
        <div className="grid size-12 place-items-center rounded-[14px] border border-border-strong bg-surface/80 text-fg backdrop-blur-md">
          <TrendingUp className="size-4" strokeWidth={1.6} />
        </div>
      </div>
      <div
        className="pointer-events-none absolute left-5 top-[30%] -translate-y-1/2 text-[11px] font-medium text-fg-dim"
        style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        }}
      >
        Debt repaid
      </div>
      <div
        className="pointer-events-none absolute bottom-3 left-5 text-[10px] uppercase tracking-[0.18em] text-fg-dim"
        style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        }}
      >
        SPREAD CAPTURE
      </div>
    </div>
  );
}
