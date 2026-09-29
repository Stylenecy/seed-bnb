"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import * as Icons from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { features } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";
import { GlowCard } from "../ui/glow-card";

export function Features() {
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
    <section id="features" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow="Capabilities"
          title="Six engineered guarantees,"
          italic="not buzzwords."
          body="Each capability maps to an onchain enforcement mechanism. The AI advises; the contract decides."
          tone="emerald"
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                f.icon
              ] ?? Icons.Sparkles;
            return (
              <div key={f.title} data-anim="fade-up">
                <GlowCard glow="emerald" className="h-full">
                  <div className="flex h-full flex-col gap-5 p-6">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-border-strong bg-white/[0.03]">
                      <Icon className="size-5 text-emerald-soft" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-base font-semibold text-fg">{f.title}</h3>
                      <p className="text-sm leading-relaxed text-fg-muted">{f.body}</p>
                    </div>
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
