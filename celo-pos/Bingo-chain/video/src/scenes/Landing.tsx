import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { SocialIcons } from "../components/SocialIcons";

const NAV = ["Home", "Arenas", "Cup", "How to play", "Profile"];
const BLURB =
  "A 5×5 board you seal before the game. Numbers are called in turn, onchain, and the winner is proven by replaying every move. Strategy over luck.";

function Vid({ src, cover = true }: { src: string; cover?: boolean }) {
  return (
    <OffthreadVideo
      src={staticFile(`videos/${src}`)}
      muted
      className={cover ? "absolute inset-0 h-full w-full object-cover" : "block h-auto w-full"}
    />
  );
}

/// Section 1 — full-bleed video hero (mirrors apps/web/components/landing/Hero.tsx).
function Hero() {
  return (
    <section className="relative h-[1080px] overflow-hidden rounded-b-[32px]">
      <Vid src="hero.mp4" />
      <div className="absolute inset-0 bg-navy/40" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1831px] flex-col px-12 py-7">
        <header className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2.5">
            <img src={staticFile("logo.png")} alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className="font-anton text-base uppercase tracking-wide text-cream">BINGOChain</span>
          </span>
          <nav className="liquid-glass rounded-[28px] px-[52px] py-[24px]">
            <ul className="flex items-center gap-8">
              {NAV.map((label) => (
                <li key={label}>
                  <span className="font-anton text-[13px] uppercase tracking-wide text-cream">{label}</span>
                </li>
              ))}
            </ul>
          </nav>
          <span className="w-[120px]" aria-hidden />
        </header>

        <div className="relative flex flex-1 items-center">
          <div className="relative ml-32 max-w-[780px] py-16">
            <h1 className="font-anton text-[90px] uppercase leading-[1.05] text-cream">
              Seal your board
              <br />
              call the ( winning ) line
            </h1>
            <span className="font-condiment pointer-events-none absolute right-4 top-1 -rotate-1 text-[48px] normal-case text-neon opacity-90 mix-blend-exclusion">
              onchain bingo
            </span>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <span className="liquid-glass rounded-[1rem] px-7 py-4 font-anton text-sm uppercase tracking-wide text-cream">
                Enter the lobby →
              </span>
              <span className="font-anton text-sm uppercase tracking-wide text-cream/70">How to play</span>
            </div>
          </div>
        </div>
      </div>
      <SocialIcons className="absolute right-8 top-28 z-10" />
    </section>
  );
}

/// Section 2 — full-bleed video intro (mirrors About.tsx).
function About() {
  return (
    <section className="relative h-[1080px] overflow-hidden">
      <Vid src="about.mp4" />
      <div className="absolute inset-0 bg-navy/40" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1831px] flex-col px-12 py-24">
        <div className="flex flex-row justify-between gap-8">
          <div className="relative">
            <h2 className="font-anton text-[60px] uppercase leading-[1.05] text-cream">
              Hello!
              <br />
              I&apos;m BINGOChain
            </h2>
            <span className="font-condiment pointer-events-none absolute -bottom-3 right-0 -rotate-2 text-[68px] normal-case text-neon mix-blend-exclusion">
              Bingo
            </span>
          </div>
          <p className="max-w-[266px] font-mono text-[16px] uppercase leading-relaxed text-cream">{BLURB}</p>
        </div>
        <div className="mt-auto flex justify-between gap-8 pt-16">
          <div className="flex flex-col gap-3">
            <p className="max-w-[266px] font-mono text-[16px] uppercase leading-relaxed text-cream opacity-40">{BLURB}</p>
            <p className="max-w-[266px] font-mono text-[16px] uppercase leading-relaxed text-cream opacity-40">{BLURB}</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="max-w-[266px] font-mono text-[16px] uppercase leading-relaxed text-cream opacity-40">{BLURB}</p>
            <p className="max-w-[266px] font-mono text-[16px] uppercase leading-relaxed text-cream opacity-40">{BLURB}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/// Section 3 — "Collection of Live arenas" (mirrors Collection.tsx).
const CARDS = [
  { video: "card1.mp4", value: "Sealed" },
  { video: "card2.mp4", value: "Onchain" },
  { video: "card3.mp4", value: "Verifiable" },
];
function Collection() {
  return (
    <section className="h-[1080px] bg-navy">
      <div className="mx-auto max-w-[1831px] px-12 py-24">
        <div className="flex flex-row items-end justify-between">
          <h2 className="font-anton text-[60px] uppercase leading-[1] text-cream">
            Collection of
            <span className="ml-32 block">
              <span className="font-condiment normal-case text-neon">Live</span> arenas
            </span>
          </h2>
          <span className="group inline-flex flex-col text-cream">
            <span className="flex items-end gap-3">
              <span className="font-anton text-[60px] uppercase leading-[0.85]">See</span>
              <span className="flex flex-col font-anton text-[36px] uppercase leading-[1]">
                <span>All</span>
                <span>Arenas</span>
              </span>
            </span>
            <span className="mt-2 h-2.5 w-full bg-neon" />
          </span>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6">
          {CARDS.map((card) => (
            <article key={card.value} className="liquid-glass rounded-[32px] p-[18px]">
              <div className="relative overflow-hidden rounded-[24px] pb-[100%]">
                <Vid src={card.video} />
              </div>
              <div className="liquid-glass mt-[18px] flex items-center justify-between rounded-[20px] px-5 py-4">
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] uppercase text-cream/70">BINGOChain</span>
                  <span className="font-anton text-[16px] uppercase text-cream">{card.value}</span>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] text-white shadow-lg shadow-purple-500/50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/// Section 4 — final CTA (mirrors Cta.tsx).
function Cta() {
  return (
    <section className="relative h-[1080px] overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Vid src="cta.mp4" />
      </div>
      <div className="absolute inset-0 bg-navy/30" />
      <div className="absolute inset-0 z-10 mx-auto flex max-w-[1831px] items-center justify-end pl-[15%] pr-[20%]">
        <div className="relative text-right">
          <span className="font-condiment pointer-events-none absolute -left-2 -top-20 -rotate-3 text-[68px] normal-case text-neon opacity-90 mix-blend-exclusion">
            Play onchain
          </span>
          <h2 className="font-anton text-[60px] uppercase leading-tight text-cream">
            <span className="mb-12 block">Play now.</span>
            Seal your board.
            <br />
            Call the winning line.
            <br />
            Claim the pot.
          </h2>
          <span className="liquid-glass mt-6 ml-auto inline-block rounded-[1rem] px-7 py-4 font-anton text-sm uppercase tracking-wide text-cream">
            Enter the lobby →
          </span>
        </div>
      </div>
      <SocialIcons className="absolute bottom-[20%] left-[8%] z-10" />
    </section>
  );
}

/** The cinematic landing, auto-scrolled through its four sections. */
export function Landing() {
  const frame = useCurrentFrame();
  const y = interpolate(
    frame,
    [0, 78, 150, 220, 290, 360, 430, 480],
    [0, 0, -1080, -1080, -2160, -2160, -3240, -3240],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );
  return (
    <AbsoluteFill className="bg-navy text-cream">
      <div style={{ transform: `translateY(${y}px)` }}>
        <Hero />
        <About />
        <Collection />
        <Cta />
      </div>
      <div className="grain-overlay" aria-hidden />
    </AbsoluteFill>
  );
}
