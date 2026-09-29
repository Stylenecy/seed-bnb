"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { whatYouCanDo } from "@/lib/content";
import { DepositChart } from "../visuals/deposit-chart";
import { ReputationGauge } from "../visuals/reputation-gauge";
import { BadgeStack } from "../visuals/badge-stack";

const VISUALS = [DepositChart, ReputationGauge, BadgeStack] as const;

export function WhatYouCanDo() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      // Char-level title reveal (line-masked)
      gsap.fromTo(
        ".wycd-char",
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.018,
          duration: 0.95,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        }
      );

      // Card enter: lift + scale + slight rotateX
      gsap.fromTo(
        ".wycd-card",
        { opacity: 0, y: 70, scale: 0.95, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          stagger: 0.12,
          duration: 1.05,
          ease: "expo.out",
          scrollTrigger: { trigger: ".wycd-grid", start: "top 82%" },
        }
      );

      // Visual: scale in nested behind the card
      gsap.fromTo(
        ".wycd-visual",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 1.2,
          delay: 0.25,
          ease: "expo.out",
          scrollTrigger: { trigger: ".wycd-grid", start: "top 82%" },
        }
      );

      // Card-text reveal: title slide-up + body fade
      gsap.fromTo(
        ".wycd-card-title",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.7,
          delay: 0.4,
          ease: "expo.out",
          scrollTrigger: { trigger: ".wycd-grid", start: "top 82%" },
        }
      );
      gsap.fromTo(
        ".wycd-card-body",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.7,
          delay: 0.55,
          ease: "expo.out",
          scrollTrigger: { trigger: ".wycd-grid", start: "top 82%" },
        }
      );

      // Scrub parallax — cards float subtly as page scrolls
      const cards = gsap.utils.toArray<HTMLElement>(".wycd-card");
      cards.forEach((card, i) => {
        gsap.to(card, {
          y: -12 - i * 4,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      });

      // Border sweep highlight on enter
      gsap.fromTo(
        ".wycd-border-sweep",
        { opacity: 0 },
        {
          opacity: 1,
          stagger: 0.12,
          duration: 0.9,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: { trigger: ".wycd-grid", start: "top 82%" },
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger && ref.current?.contains(st.trigger as Element)) {
            st.kill();
          }
        });
      };
    },
    { scope: ref }
  );

  return (
    <section
      id="capabilities"
      ref={ref}
      className="relative isolate overflow-hidden py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <h2
          className="text-center text-[clamp(2rem,5.4vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-fg"
          style={{
            fontFamily:
              "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
          }}
        >
          {whatYouCanDo.title.split(" ").map((word, wi) => (
            <span
              key={wi}
              className="mr-[0.24em] inline-flex overflow-hidden align-baseline"
            >
              {word.split("").map((ch, ci) => (
                <span
                  key={ci}
                  className="wycd-char inline-block will-change-transform"
                >
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h2>

        <div className="wycd-grid mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {whatYouCanDo.cards.map((c, i) => {
            const Visual = VISUALS[i];
            return (
              <TiltCard key={c.name}>
                <article
                  className="wycd-card group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border-strong bg-surface/45 p-6 backdrop-blur-md transition-colors duration-500 hover:bg-surface/65 sm:p-7 will-change-transform [transform-style:preserve-3d]"
                >
                  {/* Border sweep gradient overlay (enter animation) */}
                  <div
                    aria-hidden
                    className="wycd-border-sweep pointer-events-none absolute inset-0 rounded-[2rem]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(145,129,245,0.0), rgba(145,129,245,0.18) 40%, rgba(64,122,255,0.10) 70%, transparent)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      padding: 1,
                    }}
                  />

                  {/* Cursor-follow glow */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(145,129,245,0.18), transparent 50%)",
                    }}
                  />

                  {/* Hover arrow chip */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute right-5 top-5 z-10 grid size-9 translate-y-2 place-items-center rounded-full border border-border-strong bg-bg/80 text-fg opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <ArrowUpRight className="size-4" />
                  </div>

                  {/* Visual */}
                  <div
                    className="wycd-visual relative aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] border border-border bg-bg/70 transition-transform duration-700 ease-out [transform:translateZ(20px)] group-hover:scale-[1.025]"
                  >
                    {Visual ? <Visual /> : null}
                    {/* Visual top sheen on hover */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)",
                      }}
                    />
                  </div>

                  <div className="relative mt-7 flex-1 [transform:translateZ(8px)]">
                    <h3
                      className="wycd-card-title flex items-center gap-2 text-lg font-semibold tracking-tight text-fg transition-transform duration-500 group-hover:translate-x-1 sm:text-xl"
                      style={{
                        fontFamily:
                          "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
                      }}
                    >
                      {c.name}
                    </h3>
                    <p
                      className="wycd-card-body mt-3 text-sm leading-relaxed text-fg-muted sm:text-[15px]"
                      style={{
                        fontFamily:
                          "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
                      }}
                    >
                      {c.body}
                    </p>
                  </div>

                  {/* Bottom accent line on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-7 bottom-0 h-px scale-x-0 origin-left transition-transform duration-700 ease-out group-hover:scale-x-100"
                    style={{ background: "var(--gradient-brand)" }}
                  />
                </article>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Lightweight mouse-tracked tilt + cursor variables.
 * Updates --mx/--my for the radial-glow overlay and rotates the inner card
 * on a perspective transform. Lerp smoothed via requestAnimationFrame.
 */
function TiltCard({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });

  const tick = () => {
    const el = wrapRef.current;
    if (!el) return;
    current.current.rx += (target.current.rx - current.current.rx) * 0.12;
    current.current.ry += (target.current.ry - current.current.ry) * 0.12;
    el.style.setProperty("--rx", `${current.current.rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${current.current.ry.toFixed(2)}deg`);
    if (
      Math.abs(target.current.rx - current.current.rx) > 0.01 ||
      Math.abs(target.current.ry - current.current.ry) > 0.01
    ) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    el.style.setProperty("--mx", `${mx}px`);
    el.style.setProperty("--my", `${my}px`);
    const nx = (mx / rect.width - 0.5) * 2;
    const ny = (my / rect.height - 0.5) * 2;
    target.current.ry = nx * 5;
    target.current.rx = -ny * 5;
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  };

  const handleLeave = () => {
    target.current.rx = 0;
    target.current.ry = 0;
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group/tilt h-full will-change-transform [perspective:1100px]"
      style={
        {
          ["--mx" as string]: "50%",
          ["--my" as string]: "50%",
          ["--rx" as string]: "0deg",
          ["--ry" as string]: "0deg",
        } as React.CSSProperties
      }
    >
      <div
        className="h-full transition-transform duration-200 ease-out"
        style={{
          transform: "rotateX(var(--rx)) rotateY(var(--ry))",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
}
