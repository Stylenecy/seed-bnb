"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { howAuralis } from "@/lib/content";
import { AgentMesh } from "../visuals/agent-mesh";
import { ReputationBar } from "../visuals/reputation-bar";

const VISUALS = [AgentMesh, ReputationBar] as const;

export function HowAuralis() {
  const ref = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current || !pinRef.current) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current!,
            start: "top top",
            end: "+=120%",
            scrub: 0.6,
            pin: pinRef.current!,
            anticipatePin: 1,
          },
        });

        tl.fromTo(
          ".how-title",
          { scale: 1, opacity: 1, letterSpacing: "-0.02em" },
          { scale: 0.82, opacity: 0, letterSpacing: "0em", ease: "power2.inOut" },
          0
        )
          .fromTo(
            ".how-card-left",
            { xPercent: -90, opacity: 0.55, scale: 0.94 },
            { xPercent: 0, opacity: 1, scale: 1, ease: "power3.out" },
            0
          )
          .fromTo(
            ".how-card-right",
            { xPercent: 90, opacity: 0.55, scale: 0.94 },
            { xPercent: 0, opacity: 1, scale: 1, ease: "power3.out" },
            0
          );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      mm.add("(max-width: 1023px)", () => {
        gsap.fromTo(
          ".how-title",
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: ref.current!, start: "top 75%" },
          }
        );
        gsap.fromTo(
          ".how-card",
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: ".how-cards", start: "top 85%" },
          }
        );
      });

      return () => {
        mm.revert();
        ScrollTrigger.refresh();
      };
    },
    { scope: ref }
  );

  return (
    <section
      id="how"
      ref={ref}
      className="relative isolate lg:h-[220vh]"
    >
      <div
        ref={pinRef}
        className="relative flex w-full flex-col justify-center overflow-hidden py-20 sm:py-28 lg:h-screen lg:py-0"
      >
        <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-10">
          {/* Title (absolute on lg so it overlays the card row) */}
          <h2
            className="how-title relative z-10 text-center text-[clamp(2rem,6.4vw,5.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-fg lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2"
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
            }}
          >
            {howAuralis.title}
          </h2>

          <div className="how-cards relative z-20 mt-12 grid grid-cols-1 gap-6 lg:mt-0 lg:grid-cols-2 lg:gap-8">
            {howAuralis.cards.map((c, i) => {
              const Visual = VISUALS[i];
              const sideClass =
                i === 0 ? "how-card-left" : "how-card-right";
              return (
                <article
                  key={c.index}
                  className={`how-card ${sideClass} relative overflow-hidden rounded-[2rem] border border-border-strong bg-surface/45 p-7 backdrop-blur-md sm:p-8 will-change-transform`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" aria-hidden>
                      <span className="size-1.5 rounded-full bg-fg-dim/70" />
                      <span className="size-1.5 rounded-full bg-fg-dim/70" />
                      <span className="size-1.5 rounded-full bg-fg-dim/70" />
                    </div>
                    <span
                      className="text-xs uppercase tracking-[0.18em] text-fg-dim"
                      style={{
                        fontFamily:
                          "var(--font-geist-mono), ui-monospace, monospace",
                      }}
                    >
                      [{c.index}]
                    </span>
                  </div>

                  <div className="relative mt-6 aspect-[5/3] w-full overflow-hidden rounded-[1.25rem] border border-border bg-bg/70">
                    {Visual ? <Visual /> : null}
                  </div>

                  <h3
                    className="mt-7 text-lg font-semibold tracking-tight text-fg sm:text-xl"
                    style={{
                      fontFamily:
                        "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
                    }}
                  >
                    {c.name}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed text-fg-muted sm:text-[15px]"
                    style={{
                      fontFamily:
                        "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
                    }}
                  >
                    {c.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
