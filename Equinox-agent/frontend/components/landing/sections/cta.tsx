"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { ctaSection } from "@/lib/content";
import { Button } from "../ui/button";

export function CTA() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll<HTMLElement>('[data-anim="fade-up"]'),
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 80%" },
        }
      );

      gsap.to(".cta-orb-a", {
        x: 60,
        y: -30,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".cta-orb-b", {
        x: -50,
        y: 30,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: ref }
  );

  return (
    <section id="cta" ref={ref} className="relative py-24 sm:py-36">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[var(--radius-card-lg)] border border-border-strong bg-surface/70 px-8 py-20 text-center backdrop-blur-xl sm:px-16 sm:py-28">
          <div
            aria-hidden
            className="cta-orb-a pointer-events-none absolute -left-32 top-0 size-[520px] rounded-full bg-violet/30 blur-[140px]"
          />
          <div
            aria-hidden
            className="cta-orb-b pointer-events-none absolute -right-32 bottom-0 size-[520px] rounded-full bg-indigo/25 blur-[140px]"
          />
          <div aria-hidden className="absolute inset-0 bg-dot-grid opacity-[0.12]" />

          <div className="relative">
            <h2
              data-anim="fade-up"
              className="display mx-auto max-w-3xl text-[clamp(2.4rem,6vw,5rem)] font-semibold text-fg"
            >
              Ship a transparent Arisan{" "}
              <span className="serif-display text-gradient">in a weekend</span>.
            </h2>
            <p
              data-anim="fade-up"
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg"
            >
              {ctaSection.body}
            </p>
            <div
              data-anim="fade-up"
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Button href={ctaSection.primary.href} withArrow>
                {ctaSection.primary.label}
              </Button>
              <Button
                href={ctaSection.secondary.href}
                variant="secondary"
                withArrow
                external
              >
                {ctaSection.secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
