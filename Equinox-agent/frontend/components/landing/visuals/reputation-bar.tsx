"use client";

import { useEffect, useRef } from "react";

const TIERS = [
  { name: "LIQUIDATION", max: 1.0, hue: 8 },
  { name: "DEFENSE", max: 1.3, hue: 28 },
  { name: "SAFE", max: 1.5, hue: 140 },
  { name: "HEALTHY", max: 2.5, hue: 195 },
];

const MAX_HF = 2.5;
const TARGET_HF = 1.85;
const CYCLE_MS = 5200;

export function ReputationBar() {
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
    let started = performance.now();

    function sizeUp() {
      const r = wrap!.getBoundingClientRect();
      W = Math.max(280, r.width);
      H = Math.max(160, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function dotGrid() {
      const step = 8;
      ctx!.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let y = step / 2; y < H; y += step) {
        for (let x = step / 2; x < W; x += step) {
          ctx!.fillRect(x, y, 1, 1);
        }
      }
    }

    function easeOutCubic(k: number) {
      return 1 - Math.pow(1 - k, 3);
    }

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);
      dotGrid();

      const elapsed = (t - started) % CYCLE_MS;
      const fillPhase = Math.min(1, elapsed / (CYCLE_MS * 0.6));
      const hf = easeOutCubic(fillPhase) * TARGET_HF;

      ctx!.fillStyle = "rgba(220, 224, 240, 0.95)";
      ctx!.font = "600 36px ui-sans-serif, system-ui, -apple-system";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "alphabetic";
      ctx!.fillText(hf.toFixed(2), W / 2, H * 0.42);

      ctx!.fillStyle = "rgba(201, 211, 207, 0.55)";
      ctx!.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx!.fillText("HEALTH FACTOR · TARGET 1.85", W / 2, H * 0.42 + 16);

      const barY = H * 0.66;
      const padX = 32;
      const barW = W - padX * 2;
      const barH = 8;
      const segs = TIERS.length;
      const segW = barW / segs;

      ctx!.fillStyle = "rgba(255, 255, 255, 0.05)";
      roundedRect(ctx!, padX, barY, barW, barH, barH / 2);
      ctx!.fill();

      const fillW = (hf / MAX_HF) * barW;
      const grad = ctx!.createLinearGradient(padX, 0, padX + barW, 0);
      grad.addColorStop(0, "hsla(8, 90%, 60%, 0.9)");
      grad.addColorStop(0.25, "hsla(28, 90%, 60%, 0.95)");
      grad.addColorStop(0.55, "hsla(140, 70%, 60%, 0.95)");
      grad.addColorStop(1, "hsla(195, 80%, 70%, 0.95)");
      ctx!.fillStyle = grad;
      roundedRect(ctx!, padX, barY, fillW, barH, barH / 2);
      ctx!.fill();

      for (let i = 0; i < segs; i++) {
        const tier = TIERS[i];
        const x = padX + i * segW + segW / 2;
        const lowerHF = i === 0 ? 0 : TIERS[i - 1].max;
        const reached = hf >= lowerHF;

        ctx!.fillStyle = reached
          ? `hsla(${tier.hue}, 80%, 75%, 0.9)`
          : "rgba(255, 255, 255, 0.18)";
        ctx!.fillRect(padX + i * segW, barY - 4, 1, barH + 8);

        ctx!.fillStyle = reached
          ? `hsla(${tier.hue}, 50%, 90%, 0.95)`
          : "rgba(255, 255, 255, 0.32)";
        ctx!.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx!.textAlign = "center";
        ctx!.fillText(tier.name, x, barY + barH + 16);
      }

      const dotX = padX + fillW;
      ctx!.beginPath();
      ctx!.arc(dotX, barY + barH / 2, 5, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(dotX, barY + barH / 2, 9, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      raf = requestAnimationFrame(frame);
    }

    function roundedRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    sizeUp();
    const ro = new ResizeObserver(() => {
      sizeUp();
      started = performance.now();
    });
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
