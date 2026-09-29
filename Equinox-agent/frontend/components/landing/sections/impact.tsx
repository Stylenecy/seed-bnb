"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { impact } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";

export function Impact() {
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
        scrollTrigger: { trigger: ref.current, start: "top 80%" },
      });
    },
    { scope: ref }
  );

  return (
    <section id="impact" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow={impact.eyebrow}
          title="A 200-million-person primitive,"
          italic="dignified by code."
          body={impact.body}
          tone="violet"
        />

        <dl className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {impact.points.map((p) => (
            <div
              key={p.label}
              data-anim="fade-up"
              className="rounded-[var(--radius-card)] border border-border bg-surface/60 p-7 backdrop-blur-sm transition-colors hover:border-border-strong hover:bg-surface-2/60"
            >
              <dt className="display text-3xl font-semibold text-fg sm:text-4xl">
                {p.stat}
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-fg-muted">{p.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
