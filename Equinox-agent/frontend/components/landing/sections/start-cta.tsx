"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { hero } from "@/lib/content";
import { cn } from "@/lib/cn";
import { LoginModal } from "@/components/modals/LoginModal";

export function StartCTA() {
  const ref = useRef<HTMLElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      gsap.fromTo(
        ".start-cta-left",
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 75%" },
        }
      );

      gsap.fromTo(
        ".start-cta-word",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 72%" },
        }
      );
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="relative bg-bg pb-24 pt-28 sm:pb-28 sm:pt-32 lg:pb-32 lg:pt-40"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Left — title + description + Launch app */}
          <div className="start-cta-left">
            <h3
              className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-medium leading-tight text-fg"
              style={{
                fontFamily:
                  "var(--font-tech), ui-sans-serif, system-ui",
              }}
            >
              Start your self-repaying loan
            </h3>

            <div className="mt-6 flex max-w-md items-start gap-3 text-sm leading-relaxed text-fg-muted sm:text-[15px]">
              <Plus className="mt-1 size-4 shrink-0 text-fg-dim" />
              <p
                style={{
                  fontFamily:
                    "var(--font-tech), ui-sans-serif, system-ui",
                }}
              >
                Deposit BNB, pick a risk profile, and the agent borrows,
                lends, and captures the spread to repay your debt — without
                you watching Health Factor or chasing the best vault.
              </p>
            </div>

            <div className="mt-9">
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="group inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-white shadow-[0_-4px_8px_rgba(255,255,255,0.25)_inset] transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--gradient-brand)" }}
              >
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily:
                      "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  Get Started
                </span>
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-full bg-white/15"
                >
                  <ArrowUpRight className="size-3.5" />
                </span>
              </button>
            </div>
          </div>

          {/* Right — big headline mirroring hero */}
          <h2
            className="text-left text-[clamp(1.7rem,3.4vw,3.4rem)] font-normal leading-[1.15] tracking-[-0.01em] lg:text-right"
            style={{
              fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            {hero.headline.map((line, li) => (
              <span key={li} className="block overflow-hidden">
                <span className="inline-block">
                  {line.map((word, wi) => (
                    <span
                      key={wi}
                      className={cn(
                        "start-cta-word inline-block",
                        word.tone === "muted" ? "text-fg-dim" : "text-fg",
                        wi < line.length - 1 && "mr-[0.32em]"
                      )}
                    >
                      {word.text}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </h2>
        </div>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}
