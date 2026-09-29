"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { CircleCheck } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { agents } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";
import { GlowCard } from "../ui/glow-card";
import { Badge } from "../ui/badge";

export function Agents() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>('[data-anim="fade-up"]');
      gsap.to(items, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.9,
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
      });
    },
    { scope: ref }
  );

  return (
    <section id="agents" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow={agents.eyebrow}
          title="Two tiers of reasoning."
          italic="One source of truth."
          body={agents.body}
          tone="violet"
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {agents.tiers.map((t, idx) => {
            type Check = { label: string; weight?: string };
            const checks = t.checks as Check[];
            return (
              <div key={t.tag} data-anim="fade-up">
                <GlowCard glow={idx === 0 ? "violet" : "emerald"} className="h-full">
                  <div className="flex h-full flex-col gap-6 p-7">
                    <div className="flex items-center justify-between">
                      <Badge tone={idx === 0 ? "violet" : "emerald"}>{t.tag}</Badge>
                      <span className="font-mono text-xs text-fg-dim">
                        {idx === 0 ? "< 10s" : "≤ 24h"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl font-semibold tracking-tight text-fg">
                        {t.name}
                      </h3>
                      <p className="text-sm text-fg-muted">{t.mission}</p>
                    </div>

                    <ul className="space-y-3">
                      {checks.map((c) => (
                        <li
                          key={c.label}
                          className="flex items-start justify-between gap-4 border-t border-border pt-3 first:border-0 first:pt-0"
                        >
                          <div className="flex items-start gap-2 text-sm text-fg-muted">
                            <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-soft" />
                            <span>{c.label}</span>
                          </div>
                          {c.weight && (
                            <span className="font-mono text-xs text-fg-dim">
                              {c.weight}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
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
