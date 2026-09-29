"use client";

import { useEffect, useRef, useState } from "react";

const TARGET_HF = 1.85;
const MAX_HF = 2.5;
const PERIOD_MS = 6500;

export function ReputationGauge() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hf, setHf] = useState(0);

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
    let lastSet = -1;

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

      const cx = W / 2;
      // Center the dial vertically — cy moved up from 0.86 → 0.7 and radius
      // tightened so the arc midpoint lands at ~H/2 instead of below it.
      const cy = H * 0.7;
      const radius = Math.min(W * 0.38, H * 0.55);

      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, Math.PI, Math.PI * 2);
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      const totalTicks = 40;
      for (let i = 0; i <= totalTicks; i++) {
        const a = Math.PI + (i / totalTicks) * Math.PI;
        const r1 = radius;
        const r2 = i % 4 === 0 ? radius - 14 : radius - 7;
        ctx!.beginPath();
        ctx!.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx!.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx!.strokeStyle =
          i % 4 === 0
            ? "rgba(220, 224, 240, 0.72)"
            : "rgba(255, 255, 255, 0.28)";
        ctx!.lineWidth = i % 4 === 0 ? 1.4 : 0.8;
        ctx!.stroke();
      }

      const tiers = [
        { v: 0, label: "0" },
        { v: 1.0, label: "1.0" },
        { v: 1.5, label: "1.5" },
        { v: 2.0, label: "2.0" },
        { v: 2.5, label: "2.5" },
      ];
      ctx!.fillStyle = "rgba(201, 211, 207, 0.55)";
      ctx!.font =
        "500 9px var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";
      ctx!.textBaseline = "middle";
      for (const tier of tiers) {
        const a = Math.PI + (tier.v / MAX_HF) * Math.PI;
        const r = radius - 30;
        ctx!.textAlign = "center";
        ctx!.fillText(tier.label, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }

      const elapsed = t - started;
      const phase = (elapsed / PERIOD_MS) * Math.PI * 2;
      const progress = (1 - Math.cos(phase)) / 2;
      const liveHF = progress * TARGET_HF;

      const fillAngle = Math.PI + (liveHF / MAX_HF) * Math.PI;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, Math.PI, fillAngle);
      const grad = ctx!.createLinearGradient(cx - radius, cy, cx + radius, cy);
      grad.addColorStop(0, "rgba(255, 122, 144, 0.65)");
      grad.addColorStop(0.45, "rgba(255, 196, 107, 0.85)");
      grad.addColorStop(0.75, "rgba(108, 242, 204, 0.95)");
      grad.addColorStop(1, "rgba(92, 216, 255, 0.95)");
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 2.6;
      ctx!.lineCap = "round";
      ctx!.stroke();

      const ndlA = fillAngle;
      const ndlLen = radius - 10;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(ndlA) * ndlLen, cy + Math.sin(ndlA) * ndlLen);
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx!.fillStyle = "#0f0f0f";
      ctx!.fill();
      ctx!.lineWidth = 1.2;
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx!.stroke();

      const rounded = Math.round(liveHF * 100) / 100;
      if (Math.abs(rounded - lastSet) >= 0.02) {
        lastSet = rounded;
        setHf(rounded);
      }

      raf = requestAnimationFrame(frame);
    }

    sizeUp();
    const ro = new ResizeObserver(() => {
      sizeUp();
    });
    ro.observe(wrap);
    started = performance.now();
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const status =
    hf >= 1.5 ? "SAFE" : hf >= 1.3 ? "CAUTION" : hf >= 1.0 ? "DEFENSE" : "INIT";

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-1/2 top-[6%] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-border-strong bg-surface/85 px-3.5 py-1.5 backdrop-blur-md">
          <span
            className="text-base font-semibold tracking-tight text-fg tabular"
            style={{
              fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            {hf.toFixed(2)}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-fg-dim"
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            HF · {status}
          </span>
        </div>
      </div>
    </div>
  );
}
