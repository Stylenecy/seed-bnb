"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { solution } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";
import { GlowCard } from "../ui/glow-card";
import { Badge } from "../ui/badge";

export function Solution() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>('[data-anim="fade-up"]');
      gsap.to(items, {
        opacity: 1,
        y: 0,
        stagger: 0.07,
        duration: 0.8,
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
      });
    },
    { scope: ref }
  );

  return (
    <section id="solution" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow={solution.eyebrow}
          title={solution.title}
          body={solution.body}
        />

        <div className="mt-14 grid auto-rows-[1fr] gap-4 md:grid-cols-6">
          {solution.contracts.map((c, i) => {
            const span =
              i === 0
                ? "md:col-span-3"
                : i === 1
                  ? "md:col-span-3"
                  : i === 2
                    ? "md:col-span-4"
                    : i === 3
                      ? "md:col-span-2"
                      : i === 4
                        ? "md:col-span-2"
                        : "md:col-span-4";
            const glow =
              c.tag === "Core" || c.tag === "Governance"
                ? "violet"
                : c.tag === "Identity"
                  ? "emerald"
                  : "cyan";
            return (
              <div key={c.name} data-anim="fade-up" className={span}>
                <GlowCard glow={glow} className="h-full">
                  <div className="flex h-full flex-col gap-4 p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-fg-dim">
                        contracts/{c.name.toLowerCase()}
                      </span>
                      <Badge tone={glow === "emerald" ? "emerald" : "violet"}>
                        {c.tag}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-fg">
                      {c.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-fg-muted">{c.role}</p>
                  </div>
                </GlowCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
