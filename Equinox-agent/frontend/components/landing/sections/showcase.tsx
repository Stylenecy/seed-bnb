"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { Badge } from "../ui/badge";
import { solution } from "@/lib/content";
import { cn } from "@/lib/cn";

const accents = ["violet", "indigo", "emerald", "cyan", "violet", "indigo"] as const;

export function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current || !trackRef.current) return;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) return;

      const track = trackRef.current;
      const distance = track.scrollWidth - window.innerWidth + 80;

      const tween = gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        ScrollTrigger.refresh();
      };
    },
    { scope: ref }
  );

  return (
    <section
      id="showcase"
      ref={ref}
      className="relative overflow-hidden py-20 lg:h-screen lg:py-0"
    >
      <div className="mx-auto flex h-full max-w-[1300px] flex-col justify-center px-6 lg:px-10">
        <div className="mb-10 flex max-w-3xl flex-col gap-5">
          <div data-anim="fade-up">
            <Badge tone="violet">Onchain primitives</Badge>
          </div>
          <h2
            data-anim="fade-up"
            className="display text-[clamp(2rem,4.4vw,3.6rem)] font-semibold text-fg"
          >
            Six contracts.{" "}
            <span className="serif-display text-gradient">One protocol.</span>
          </h2>
          <p data-anim="fade-up" className="text-base text-fg-muted sm:text-lg">
            Scroll horizontally through every ink! contract that ships with Auralis. Each
            is independently auditable, each pays POT for gas.
          </p>
        </div>

        <div className="relative -mx-6 lg:-mx-10">
          <div
            ref={trackRef}
            className="flex gap-5 px-6 will-change-transform lg:px-10"
          >
            {solution.contracts.map((c, i) => (
              <ShowcaseCard
                key={c.name}
                index={i}
                name={c.name}
                role={c.role}
                tag={c.tag}
                accent={accents[i % accents.length]}
              />
            ))}
          </div>

          {/* Side fades */}
          <div
            aria-hidden
            className="fade-left pointer-events-none absolute inset-y-0 left-0 hidden w-24 lg:block"
          />
          <div
            aria-hidden
            className="fade-right pointer-events-none absolute inset-y-0 right-0 hidden w-24 lg:block"
          />
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  index,
  name,
  role,
  tag,
  accent,
}: {
  index: number;
  name: string;
  role: string;
  tag: string;
  accent: "violet" | "indigo" | "emerald" | "cyan";
}) {
  const accentMap = {
    violet: "from-violet/30 via-violet/5 to-transparent",
    indigo: "from-indigo/30 via-indigo/5 to-transparent",
    emerald: "from-emerald/25 via-emerald/5 to-transparent",
    cyan: "from-cyan/25 via-cyan/5 to-transparent",
  };

  return (
    <article
      data-anim="fade-up"
      className="relative flex w-[78vw] shrink-0 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface/60 p-10 backdrop-blur-md sm:w-[420px] lg:w-[480px] lg:p-12"
    >
      <div
        aria-hidden
        className={cn(
          "absolute -top-32 -right-32 size-[420px] rounded-full bg-gradient-to-br blur-3xl",
          accentMap[accent]
        )}
      />

      <div className="relative flex items-start justify-between">
        <span className="font-mono text-xs text-fg-dim">
          {String(index + 1).padStart(2, "0")} / 06
        </span>
        <Badge tone={accent === "emerald" ? "emerald" : "violet"}>{tag}</Badge>
      </div>

      <div className="relative mt-16 flex flex-col gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-fg-dim">
          contracts/{name.toLowerCase()}
        </span>
        <h3 className="display text-[clamp(1.8rem,3vw,2.6rem)] font-semibold text-fg">
          {name}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-fg-muted">{role}</p>
      </div>
    </article>
  );
}
