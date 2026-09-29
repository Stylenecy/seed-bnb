import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, staticFile } from "remotion";
import {
  Dices, EyeOff, Lock, ShieldCheck, Cpu, RefreshCw, BadgeCheck,
  Zap, ScrollText, Smartphone,
} from "lucide-react";
import { SpaceBackdrop } from "../components/SpaceBackdrop";
import { cn } from "../lib/cn";

/* ── motion helpers ─────────────────────────────────────────────────────────── */

function useEnter(delay: number, dur = 20) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: dur });
}

/** Fade + rise (optionally slide from a side) keyed to a delay. */
function Reveal({ delay, children, x = 0, y = 18, className }: { delay: number; children: ReactNode; x?: number; y?: number; className?: string }) {
  const p = useEnter(delay);
  return (
    <div className={className} style={{ opacity: p, transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px)` }}>
      {children}
    </div>
  );
}

/** Count a number up to its target. */
function CountUp({ to, delay, dur = 34, decimals = 0, prefix = "", suffix = "" }: { to: number; delay: number; dur?: number; decimals?: number; prefix?: string; suffix?: string }) {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, dur], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <>{prefix}{v.toFixed(decimals)}{suffix}</>;
}

function Eyebrow({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <Reveal delay={delay} y={10}>
      <p className="mb-5 font-mono text-base uppercase tracking-[0.42em] text-neon/85">{children}</p>
    </Reveal>
  );
}

function Shell({ children, glow }: { children: ReactNode; glow?: string }) {
  return (
    <AbsoluteFill className="bg-background text-foreground">
      <SpaceBackdrop />
      {glow && <div className="pointer-events-none absolute inset-0" style={{ background: glow }} />}
      <AbsoluteFill className="z-10 flex items-center justify-center px-24">
        <div className="w-full max-w-5xl">{children}</div>
      </AbsoluteFill>
      <div className="grain-overlay opacity-40" aria-hidden />
    </AbsoluteFill>
  );
}

/* ── 01 · THE PROBLEM ───────────────────────────────────────────────────────── */
const PROBLEMS = [
  { icon: Dices, title: "Hidden RNG", sub: "randomness you can’t see" },
  { icon: EyeOff, title: "Opaque winners", sub: "“just trust us”" },
  { icon: Lock, title: "Custody risk", sub: "funds on their server" },
];
export function Problem() {
  return (
    <Shell glow="radial-gradient(48rem 34rem at 50% 8%, hsl(var(--destructive) / 0.16), transparent 60%)">
      <Eyebrow delay={4}>01 · The problem</Eyebrow>
      <Reveal delay={8} y={26}>
        <h2 className="font-anton text-[5.5rem] uppercase leading-[0.92] text-cream [text-shadow:0_2px_30px_rgba(1,8,40,0.6)]">
          Online games ask you to
          <br />
          <span className="text-destructive">trust the house.</span>
        </h2>
      </Reveal>
      <div className="mt-14 grid grid-cols-3 gap-6">
        {PROBLEMS.map((p, i) => (
          <Reveal key={p.title} delay={26 + i * 9} y={34}>
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
              <p.icon className="size-9 text-destructive" />
              <p className="mt-4 font-anton text-2xl uppercase text-cream">{p.title}</p>
              <p className="mt-1 font-mono text-sm text-cream/60">{p.sub}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

/* ── 02 · THE SOLUTION ──────────────────────────────────────────────────────── */
const PILLARS = [
  { icon: Lock, title: "Commit–reveal", sub: "boards locked & hidden — only the hash goes on-chain" },
  { icon: Cpu, title: "No oracle, no VRF", sub: "players call the numbers in turn — zero hidden randomness" },
  { icon: RefreshCw, title: "Winners verified", sub: "the contract replays every move against revealed boards" },
  { icon: BadgeCheck, title: "Provably impossible to cheat", sub: "a false claim fails verification and is slashed" },
];
export function Solution() {
  return (
    <Shell glow="radial-gradient(50rem 36rem at 50% 0%, hsl(var(--primary) / 0.14), transparent 62%)">
      <div className="flex items-center gap-4">
        <Reveal delay={2} y={0}>
          <img src={staticFile("logo.png")} alt="" className="size-14 rounded-xl" />
        </Reveal>
        <Eyebrow delay={4}>02 · The solution</Eyebrow>
      </div>
      <Reveal delay={8} y={26}>
        <h2 className="font-anton text-[5.5rem] uppercase leading-[0.9] text-cream [text-shadow:0_2px_30px_rgba(1,8,40,0.6)]">
          Seal it. <span className="text-neon">Prove it.</span> On-chain.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-5">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={24 + i * 8} x={-40} y={0}>
            <div className="glass flex items-start gap-4 rounded-2xl p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-neon/15 text-neon">
                <p.icon className="size-6" />
              </span>
              <div>
                <p className="font-anton text-xl uppercase text-cream">{p.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-cream/65">{p.sub}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

/* ── 03 · WHY ON-CHAIN ──────────────────────────────────────────────────────── */
function StatCard({ delay, value, label }: { delay: number; value: ReactNode; label: string }) {
  return (
    <Reveal delay={delay} y={30}>
      <div className="glass rounded-2xl p-6 text-center">
        <p className="font-anton text-[3.4rem] leading-none text-neon">{value}</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-cream/65">{label}</p>
      </div>
    </Reveal>
  );
}
export function WhyOnchain() {
  return (
    <Shell glow="radial-gradient(50rem 36rem at 50% 4%, hsl(var(--primary) / 0.12), transparent 62%)">
      <Eyebrow delay={4}>03 · Why on-chain</Eyebrow>
      <Reveal delay={8} y={24}>
        <h2 className="font-anton text-[5.5rem] uppercase leading-[0.9] text-cream [text-shadow:0_2px_30px_rgba(1,8,40,0.6)]">
          Provably fair. <span className="text-neon">No house.</span>
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-4 gap-5">
        <StatCard delay={26} value={<>&lt;$0.01</>} label="fees on Celo" />
        <StatCard delay={34} value={<CountUp to={25} delay={34} />} label="calls / round · fixed" />
        <StatCard delay={42} value={<CountUp to={0} delay={42} />} label="Slither vulns" />
        <StatCard delay={50} value={<CountUp to={86} delay={50} />} label="tests passing" />
      </div>
      <Reveal delay={64} y={16}>
        <p className="mt-10 text-center font-mono text-base uppercase tracking-[0.16em] text-cream/70">
          <Zap className="mb-1 mr-2 inline size-5 text-neon" />Gasless play
          <ScrollText className="mb-1 mx-2 inline size-5 text-neon" />Auditable on Celoscan
          <Smartphone className="mb-1 mx-2 inline size-5 text-neon" />MiniPay-ready
        </p>
      </Reveal>
    </Shell>
  );
}

/* ── 04 · CTA ───────────────────────────────────────────────────────────────── */
export function Cta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 12, mass: 0.8 }, durationInFrames: 30 });
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  return (
    <Shell glow="radial-gradient(46rem 40rem at 50% 40%, hsl(var(--primary) / 0.18), transparent 60%)">
      <div className="flex flex-col items-center text-center">
        <div style={{ transform: `scale(${interpolate(logoIn, [0, 1], [0.6, 1])})`, opacity: logoIn }}>
          <img
            src={staticFile("logo.png")}
            alt="BINGOChain"
            className="size-32 rounded-[1.5rem]"
            style={{ boxShadow: `0 0 ${40 + pulse * 50}px hsl(var(--primary) / ${0.35 + pulse * 0.25})` }}
          />
        </div>
        <Reveal delay={12} y={18}>
          <h2 className="mt-7 font-anton text-7xl uppercase tracking-tight">
            <span className="text-gradient-gold">BINGO</span>
            <span className="text-cream">Chain</span>
          </h2>
        </Reveal>
        <Reveal delay={22} y={16}>
          <p className="mt-4 font-anton text-2xl uppercase leading-snug text-cream/90">
            Seal your board. Call the winning line. <span className="text-neon">Claim the pot.</span>
          </p>
        </Reveal>
        <Reveal delay={34} y={16}>
          <div
            className="mt-9 rounded-2xl bg-primary px-10 py-5 font-anton text-2xl uppercase tracking-wide text-primary-foreground"
            style={{ boxShadow: `0 0 0 1px hsl(var(--gold-400)/0.4), 0 14px 50px -10px hsl(var(--gold-400) / ${0.4 + pulse * 0.3})` }}
          >
            Play now → bingochain.vercel.app
          </div>
        </Reveal>
        <Reveal delay={44} y={12}>
          <p className="mt-7 font-mono text-sm uppercase tracking-[0.22em] text-cream/55">
            Strategic onchain bingo on Celo · staked in $LANCE · built on Claudelance
          </p>
        </Reveal>
      </div>
    </Shell>
  );
}
