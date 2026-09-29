"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { problems } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";
import { GlowCard } from "../ui/glow-card";

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>('[data-anim="fade-up"]');
      gsap.to(items, {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.8,
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
      });
    },
    { scope: ref }
  );

  return (
    <section id="problem" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow="The problem"
          title="Arisan works — until"
          italic="trust does not scale."
          body="Five recurring failure modes break Indonesia's most-loved community savings ritual. Auralis names them, then makes each one expensive."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, i) => (
            <div key={p.title} data-anim="fade-up">
              <GlowCard glow="violet" className="h-full">
                <div className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-border-strong bg-white/[0.03] font-mono text-xs text-fg-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-semibold text-fg">{p.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted">{p.body}</p>
                </div>
              </GlowCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
