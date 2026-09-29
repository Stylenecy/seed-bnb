"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { workflow } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";

export function HowItWorks() {
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

      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 60%",
            end: "bottom 60%",
            scrub: 0.5,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <section id="workflow" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow={workflow.eyebrow}
          title="Six steps from"
          italic="request to release."
          body={workflow.body}
        />

        <div className="relative mt-16">
          <div
            aria-hidden
            className="timeline-line absolute left-[19px] top-2 hidden h-[calc(100%-3rem)] w-px origin-top bg-gradient-to-b from-violet/60 via-emerald/40 to-transparent md:block"
          />
          <ol className="grid gap-4 md:grid-cols-2 md:gap-8">
            {workflow.steps.map((s) => (
              <li
                key={s.n}
                data-anim="fade-up"
                className="relative rounded-[var(--radius-card)] border border-border bg-surface/60 p-6 backdrop-blur-sm transition-colors hover:border-border-strong hover:bg-surface-2/60"
              >
                <div className="flex items-start gap-5">
                  <span className="z-10 grid size-10 shrink-0 place-items-center rounded-full border border-border-strong bg-bg font-mono text-xs text-violet-soft shadow-[0_0_0_4px_var(--color-bg)]">
                    {s.n}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-semibold text-fg">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-fg-muted">{s.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
