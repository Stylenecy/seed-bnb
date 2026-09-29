"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  label: string;
  hue: number;
  spawnAt: number;
};

type Pulse = {
  fromX: number;
  fromY: number;
  startedAt: number;
  duration: number;
  hue: number;
};

const LABELS = ["BNB", "USDT", "Venus", "Lista", "PancakeSwap", "Shadow"];

export function AgentMesh() {
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

    let nodes: Node[] = [];
    let centerX = 0;
    let centerY = 0;
    let centerPulse = 0;
    const pulses: Pulse[] = [];

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

      centerX = W / 2;
      centerY = H / 2;
      const radius = Math.min(W, H) * 0.36;
      nodes = LABELS.map((label, i) => {
        const angle = (-Math.PI / 2) + (i / LABELS.length) * Math.PI * 2;
        const hue = 250 + ((i * 18) % 70);
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          label,
          hue,
          spawnAt: performance.now() + 400 + i * 250 + Math.random() * 400,
        };
      });
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

    function drawNode(n: Node) {
      const label = n.label;
      const padX = 8;
      ctx!.save();
      ctx!.font = "600 9px var(--font-geist-mono), ui-monospace, monospace";
      const w = ctx!.measureText(label).width + padX * 2;
      const h = 18;
      const x = n.x - w / 2;
      const y = n.y - h / 2;

      ctx!.beginPath();
      ctx!.fillStyle = `hsla(${n.hue}, 80%, 65%, 0.08)`;
      roundedRect(ctx!, x - 3, y - 3, w + 6, h + 6, (h + 6) / 2);
      ctx!.fill();

      ctx!.beginPath();
      roundedRect(ctx!, x, y, w, h, h / 2);
      ctx!.fillStyle = "#0f0f0f";
      ctx!.fill();
      ctx!.lineWidth = 1.2;
      ctx!.strokeStyle = `hsla(${n.hue}, 80%, 70%, 0.85)`;
      ctx!.stroke();

      ctx!.fillStyle = `hsla(${n.hue}, 50%, 92%, 0.95)`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(label, n.x, n.y);
      ctx!.restore();
    }

    function drawLinks() {
      ctx!.lineWidth = 0.7;
      for (const n of nodes) {
        ctx!.strokeStyle = `hsla(${n.hue}, 80%, 70%, 0.18)`;
        ctx!.beginPath();
        ctx!.moveTo(n.x, n.y);
        ctx!.lineTo(centerX, centerY);
        ctx!.stroke();
      }
    }

    function drawCenter(t: number) {
      const baseR = 18;
      const pulse = Math.max(0, centerPulse);
      const r = baseR + pulse * 14;

      const grad = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, r + 22);
      grad.addColorStop(0, "rgba(145, 129, 245, 0.5)");
      grad.addColorStop(1, "rgba(145, 129, 245, 0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(centerX - r - 28, centerY - r - 28, (r + 28) * 2, (r + 28) * 2);

      ctx!.save();
      ctx!.translate(centerX, centerY);
      ctx!.rotate(Math.PI / 4 + Math.sin(t / 1400) * 0.05);
      ctx!.fillStyle = "#0a0a0a";
      ctx!.strokeStyle = `rgba(255, 255, 255, ${0.85 + pulse * 0.15})`;
      ctx!.lineWidth = 1.4;
      const s = baseR;
      ctx!.beginPath();
      ctx!.rect(-s, -s, s * 2, s * 2);
      ctx!.fill();
      ctx!.stroke();
      ctx!.restore();

      ctx!.fillStyle = `rgba(220, 224, 240, ${0.78 + pulse * 0.22})`;
      ctx!.font = "600 9px var(--font-geist-mono), ui-monospace, monospace";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText("AGENT", centerX, centerY);

      ctx!.fillStyle = "rgba(201, 211, 207, 0.55)";
      ctx!.font = "500 9px var(--font-geist-mono), ui-monospace, monospace";
      ctx!.fillText("LTV 55%", centerX, centerY + baseR + 14);

      centerPulse *= 0.92;
    }

    function drawPulses(t: number) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const k = (t - p.startedAt) / p.duration;
        if (k >= 1) {
          centerPulse = Math.min(1.2, centerPulse + 0.55);
          pulses.splice(i, 1);
          continue;
        }
        const x = p.fromX + (centerX - p.fromX) * k;
        const y = p.fromY + (centerY - p.fromY) * k;
        ctx!.beginPath();
        ctx!.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 75%, ${1 - k * 0.4})`;
        ctx!.fill();
      }
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

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);
      dotGrid();
      drawLinks();

      for (const n of nodes) {
        if (t >= n.spawnAt) {
          pulses.push({
            fromX: n.x,
            fromY: n.y,
            startedAt: t,
            duration: 900 + Math.random() * 500,
            hue: n.hue,
          });
          n.spawnAt = t + 2200 + Math.random() * 2400;
        }
      }

      drawPulses(t);
      drawCenter(t);
      for (const n of nodes) drawNode(n);

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
