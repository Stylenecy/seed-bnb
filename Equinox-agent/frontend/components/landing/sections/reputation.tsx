"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Award, ShieldCheck } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { reputation } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";
import { GlowCard } from "../ui/glow-card";
import { cn } from "@/lib/cn";

export function Reputation() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>('[data-anim="fade-up"]');
      gsap.to(items, {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        duration: 0.8,
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
      });
    },
    { scope: ref }
  );

  return (
    <section id="reputation" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow={reputation.eyebrow}
          title="Portable reputation,"
          italic="soulbound attestations."
          body={reputation.body}
          tone="emerald"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Tiers */}
          <div data-anim="fade-up">
            <GlowCard glow="violet" interactive={false} className="h-full">
              <div className="flex h-full flex-col gap-5 p-7">
                <div className="flex items-center gap-2 text-fg-muted">
                  <Award className="size-4 text-violet-soft" />
                  <span className="text-[11px] uppercase tracking-wider">Tiers</span>
                </div>

                <div className="flex flex-col gap-3">
                  {reputation.tiers.map((t) => (
                    <div
                      key={t.name}
                      className="relative overflow-hidden rounded-2xl border border-border bg-bg/40 p-4"
                    >
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 w-1 rounded-r-full bg-gradient-to-b",
                          t.accent
                        )}
                      />
                      <div className="ml-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-fg">{t.name}</p>
                        <p className="font-mono text-xs text-fg-dim">{t.range}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto rounded-2xl border border-border bg-bg/40 p-4 text-xs leading-relaxed text-fg-dim">
                  <p>
                    vote_weight = base × (0.5 + rep/1000) × (1 + 0.1 × trusted_badges)
                  </p>
                </div>
              </div>
            </GlowCard>
          </div>

          {/* Badges */}
          <div data-anim="fade-up">
            <GlowCard glow="emerald" interactive={false} className="h-full">
              <div className="flex h-full flex-col gap-5 p-7">
                <div className="flex items-center gap-2 text-fg-muted">
                  <ShieldCheck className="size-4 text-emerald-soft" />
                  <span className="text-[11px] uppercase tracking-wider">
                    Soulbound badges
                  </span>
                </div>

                <ul className="flex flex-col">
                  {reputation.badges.map((b) => (
                    <li
                      key={b.name}
                      className="flex items-start justify-between gap-6 border-t border-border py-4 first:border-0 first:pt-0"
                    >
                      <div className="flex items-start gap-3">
                        <span aria-hidden className="mt-1 size-6 rounded-full ring-conic">
                          <span className="block size-full scale-[0.6] rounded-full bg-bg" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-fg">{b.name}</p>
                          <p className="text-xs text-fg-muted">{b.trigger}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-emerald-soft">{b.rep}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlowCard>
          </div>
        </div>
      </div>
    </section>
  );
}
