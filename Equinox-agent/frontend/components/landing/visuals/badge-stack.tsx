"use client";

import { useEffect, useRef } from "react";

type Particle = {
  layer: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
};

const LAYERS = 3;
const PARTICLES_PER_LAYER = 7;

export function BadgeStack() {
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

    const particles: Particle[] = [];
    for (let l = 0; l < LAYERS; l++) {
      for (let i = 0; i < PARTICLES_PER_LAYER; i++) {
        particles.push({
          layer: l,
          angle: (i / PARTICLES_PER_LAYER) * Math.PI * 2 + Math.random() * 0.6,
          radius: 0.3 + Math.random() * 0.55,
          speed: 0.00009 + Math.random() * 0.00013,
          size: 2 + Math.random() * 2,
          hue: 0,
        });
      }
    }

    const tierLabels = ["VENUS", "LISTA", "PANCAKESWAP"];

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

    function drawDisk(
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      glow: number,
      layerIndex: number
    ) {
      // outer ellipse (top face)
      const grad = ctx!.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.10)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.04)");
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx!.fill();

      // rim stroke
      ctx!.strokeStyle = `rgba(255, 255, 255, ${0.45 + glow * 0.2})`;
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      // tier label
      ctx!.fillStyle = `rgba(220, 224, 240, ${0.62 + glow * 0.18})`;
      ctx!.font =
        "600 9px var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(tierLabels[layerIndex], cx, cy);
    }

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H * 0.5;
      const rxBase = Math.min(W * 0.36, 130);
      const ryBase = rxBase * 0.34;
      const gap = ryBase * 1.5;
      const wobble = Math.sin(t / 3400) * 4;

      // back-most first
      for (let l = LAYERS - 1; l >= 0; l--) {
        const y = cy + (l - 1) * gap + wobble * (l === 1 ? 0 : 1) * 0.3;
        const rx = rxBase * (1 - l * 0.03);
        const ry = ryBase * (1 - l * 0.03);
        const glow = (Math.sin(t / 1300 + l * 1.4) + 1) / 2;
        drawDisk(cx, y, rx, ry, glow, l);

        // particles drifting in/around the disk
        for (const p of particles) {
          if (p.layer !== l) continue;
          const a = p.angle + t * p.speed;
          const pr = p.radius;
          const px = cx + Math.cos(a) * rx * pr;
          const py = y + Math.sin(a) * ry * pr * 0.6;
          ctx!.beginPath();
          ctx!.arc(px, py, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(220, 224, 240, ${0.45 + glow * 0.4})`;
          ctx!.fill();
        }
      }

      // connecting thread between disks (subtle)
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy - gap);
      ctx!.lineTo(cx, cy + gap);
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
    </div>
  );
}
