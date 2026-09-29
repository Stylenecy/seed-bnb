"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { hero } from "@/lib/content";
import { cn } from "@/lib/cn";
import { LoginModal } from "@/components/modals/LoginModal";
import { CoinLottie } from "../ui/coin-lottie";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useGSAP(
    () => {
      registerGsap();

      // === Copy entrance timeline ===
      const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1 } });
      tl.fromTo(
        ".hero-word",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.9 }
      )
        .fromTo(
          ".hero-desc",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          ".hero-cta-row",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.45"
        )
        .fromTo(
          ".hero-field",
          { opacity: 0, scale: 0.86, rotation: -8, y: 28 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            y: 0,
            duration: 1.4,
            ease: "expo.out",
          },
          "-=0.85"
        );

      // === Coin idle motion ===
      // Vertical bob
      gsap.to("[data-float]", {
        y: -16,
        duration: 3.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      // Subtle constant Z-sway (rotation around vertical)
      gsap.to("[data-float]", {
        rotateZ: 1.6,
        duration: 6.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      // Heartbeat scale every 4s
      gsap.to("[data-coin-pulse]", {
        scale: 1.025,
        duration: 0.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        repeatDelay: 3,
      });

      // === Orbit ring rotations ===
      gsap.to("[data-orbit]", {
        rotation: 360,
        duration: 32,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to("[data-orbit-inner]", {
        rotation: -360,
        duration: 22,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to("[data-orbit-tilted]", {
        rotation: 360,
        duration: 26,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });

      // === Conic backsplash sweep ===
      gsap.to("[data-conic]", {
        rotation: 360,
        duration: 18,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });

      // === Sonar pulses (3, staggered) ===
      gsap.utils.toArray<HTMLElement>("[data-sonar]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { scale: 0.55, opacity: 0.65 },
          {
            scale: 1.55,
            opacity: 0,
            duration: 3.8,
            ease: "power2.out",
            repeat: -1,
            delay: i * 1.3,
          }
        );
      });

      // === Glow breathing ===
      gsap.to("[data-glow]", {
        opacity: 1,
        scale: 1.14,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // === Drifting micro-particles (per-element random paths) ===
      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el, i) => {
        const dur = 5 + (i % 4) * 1.4;
        const dx = (i % 2 === 0 ? 1 : -1) * (8 + (i % 3) * 6);
        const dy = (i % 3 === 0 ? -1 : 1) * (10 + (i % 4) * 5);
        gsap.to(el, {
          x: dx,
          y: dy,
          duration: dur,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.2,
        });
        gsap.to(el, {
          opacity: 0.3,
          duration: 1.2 + (i % 3) * 0.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.15,
        });
      });

      // === Twinkles on satellite stars ===
      gsap.utils.toArray<HTMLElement>("[data-twinkle]").forEach((el, i) => {
        gsap.to(el, {
          opacity: 0.35,
          duration: 1.4 + (i % 3) * 0.4,
          delay: i * 0.18,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      // === Mouse-parallax tilt + cursor-following glow + hover scale ===
      const field = fieldRef.current;
      const float = floatRef.current;
      if (field && float) {
        const onMove = (e: MouseEvent) => {
          const r = field.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(float, {
            rotationY: nx * 16,
            rotationX: -ny * 12,
            duration: 0.9,
            ease: "power3.out",
            transformPerspective: 1000,
          });
          field.style.setProperty("--cx", `${(e.clientX - r.left) / r.width * 100}%`);
          field.style.setProperty("--cy", `${(e.clientY - r.top) / r.height * 100}%`);
        };
        const onLeave = () => {
          gsap.to(float, {
            rotationX: 0,
            rotationY: 0,
            duration: 1.1,
            ease: "elastic.out(1, 0.6)",
          });
          field.style.setProperty("--cx", `50%`);
          field.style.setProperty("--cy", `50%`);
        };
        const onEnter = () => {
          gsap.to("[data-coin-pulse]", {
            scale: 1.05,
            duration: 0.8,
            ease: "power3.out",
          });
          gsap.to("[data-glow]", {
            opacity: 1.1,
            duration: 0.8,
            ease: "power2.out",
          });
        };
        const onLeaveCoin = () => {
          gsap.to("[data-coin-pulse]", {
            scale: 1,
            duration: 1,
            ease: "elastic.out(1, 0.5)",
          });
        };
        field.addEventListener("mousemove", onMove);
        field.addEventListener("mouseleave", onLeave);
        float.addEventListener("mouseenter", onEnter);
        float.addEventListener("mouseleave", onLeaveCoin);
        return () => {
          field.removeEventListener("mousemove", onMove);
          field.removeEventListener("mouseleave", onLeave);
          float.removeEventListener("mouseenter", onEnter);
          float.removeEventListener("mouseleave", onLeaveCoin);
        };
      }
    },
    { scope: ref }
  );

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24 lg:min-h-[880px] lg:pt-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-dot-grid opacity-[0.18]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-12 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_540px] lg:items-center lg:gap-12 lg:px-10 xl:gap-20">
        {/* Left — headline + description + CTA */}
        <div className="relative z-10 max-w-[640px] lg:order-1 lg:max-w-[600px]">
          <h1
            className="text-[clamp(1.5rem,2.9vw,2.6rem)] font-normal leading-[1.15] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-tech), ui-sans-serif, system-ui" }}
          >
            {hero.headline.map((line, li) => (
              <span key={li} className="block overflow-hidden">
                <span className="inline-block">
                  {line.map((word, wi) => (
                    <span
                      key={wi}
                      className={cn(
                        "hero-word inline-block",
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
          </h1>

          <div className="hero-desc mt-10 flex max-w-md items-start gap-3">
            <span
              aria-hidden
              className="mt-[6px] grid size-5 place-items-center rounded-full border border-border-strong text-fg-dim"
            >
              <Plus className="size-3" />
            </span>
            <p className="text-sm leading-relaxed text-fg-muted sm:text-[15px]">
              {hero.description}
            </p>
          </div>

          <div className="hero-cta-row mt-9">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-bg shadow-[0_-4px_7px_rgba(225,225,225,0.32)_inset] transition-colors hover:bg-[#fafafa]"
            >
              <span>{hero.openApp.label}</span>
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-full"
                style={{ background: "var(--gradient-brand)" }}
              >
                <ArrowUpRight className="size-3.5 text-white transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
              </span>
            </button>
          </div>
        </div>

        {/* Right — animated coin field */}
        <div
          ref={fieldRef}
          className="hero-field relative mx-auto flex aspect-square w-full max-w-[420px] origin-center items-center justify-center sm:max-w-[480px] lg:order-2 lg:mx-0 lg:max-w-[540px] lg:justify-end"
          style={{
            perspective: 1200,
            ["--cx" as string]: "50%",
            ["--cy" as string]: "50%",
          } as React.CSSProperties}
        >
          {/* Conic gradient backsplash sweep — rotates slowly */}
          <div
            data-conic
            aria-hidden
            className="absolute inset-[4%] rounded-full opacity-50 will-change-transform"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(145,129,245,0.22) 60deg, rgba(255,122,144,0.22) 140deg, rgba(92,216,255,0.22) 220deg, transparent 320deg)",
              filter: "blur(38px)",
              maskImage:
                "radial-gradient(circle, black 30%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(circle, black 30%, transparent 70%)",
            }}
          />

          {/* Breathing glow behind */}
          <div
            data-glow
            aria-hidden
            className="absolute inset-[10%] rounded-full opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(255,122,144,0.45) 0%, rgba(145,129,245,0.28) 40%, transparent 72%)",
              filter: "blur(32px)",
            }}
          />

          {/* Cursor-following light */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-60 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(220px circle at var(--cx) var(--cy), rgba(255,255,255,0.06), transparent 60%)",
            }}
          />

          {/* Sonar pulse waves — 3 expanding circles */}
          {[0, 1, 2].map((i) => (
            <div
              key={`sonar-${i}`}
              data-sonar
              aria-hidden
              className="absolute inset-[14%] rounded-full will-change-transform"
              style={{
                border: "1px solid rgba(145,129,245,0.45)",
                boxShadow:
                  "0 0 22px rgba(145,129,245,0.18), inset 0 0 22px rgba(255,122,144,0.12)",
              }}
            />
          ))}

          {/* Outer rotating dashed ring */}
          <svg
            data-orbit
            aria-hidden
            viewBox="0 0 400 400"
            className="absolute inset-0 h-full w-full will-change-transform"
          >
            <defs>
              <linearGradient id="orbit-stroke" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
                <stop offset="35%" stopColor="rgba(145,129,245,0.55)" />
                <stop offset="65%" stopColor="rgba(92,216,255,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
              </linearGradient>
            </defs>
            <circle
              cx="200"
              cy="200"
              r="186"
              fill="none"
              stroke="url(#orbit-stroke)"
              strokeWidth="1.2"
              strokeDasharray="2 6"
            />
            <circle
              cx="200"
              cy="14"
              r="3.2"
              fill="#fff"
              style={{ filter: "drop-shadow(0 0 6px rgba(145,129,245,0.9))" }}
            />
            <circle
              cx="386"
              cy="200"
              r="2"
              fill="#fff"
              opacity="0.7"
              style={{ filter: "drop-shadow(0 0 4px rgba(92,216,255,0.8))" }}
            />
          </svg>

          {/* Tilted Saturn-style ring — rotated on Y axis so it appears elliptical */}
          <svg
            data-orbit-tilted
            aria-hidden
            viewBox="0 0 400 400"
            className="absolute inset-[-2%] h-[104%] w-[104%] will-change-transform"
            style={{ transform: "rotateX(72deg)" }}
          >
            <circle
              cx="200"
              cy="200"
              r="194"
              fill="none"
              stroke="rgba(255,122,144,0.35)"
              strokeWidth="1.3"
              strokeDasharray="1 5"
            />
            <circle
              cx="200"
              cy="6"
              r="2.6"
              fill="#ff7a90"
              style={{ filter: "drop-shadow(0 0 6px rgba(255,122,144,0.9))" }}
            />
            <circle
              cx="200"
              cy="394"
              r="2"
              fill="#ff7a90"
              opacity="0.7"
            />
          </svg>

          {/* Counter-rotating inner accent */}
          <svg
            data-orbit-inner
            aria-hidden
            viewBox="0 0 400 400"
            className="absolute inset-[12%] h-[76%] w-[76%] will-change-transform"
          >
            <circle
              cx="200"
              cy="200"
              r="170"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <circle
              cx="370"
              cy="200"
              r="2.6"
              fill="rgba(228,243,61,0.95)"
              style={{ filter: "drop-shadow(0 0 6px rgba(228,243,61,0.9))" }}
            />
            <circle
              cx="30"
              cy="200"
              r="1.6"
              fill="rgba(255,255,255,0.8)"
            />
          </svg>

          {/* Animated BNB Chain crypto coin (Lottie) with tilt */}
          <div
            ref={floatRef}
            className="relative h-[84%] w-[84%] cursor-pointer will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div data-float className="relative h-full w-full">
              <div
                data-coin-pulse
                className="relative h-full w-full"
                style={{
                  filter:
                    "drop-shadow(0 40px 60px rgba(67,97,252,0.35)) drop-shadow(0 0 40px rgba(145,129,245,0.25))",
                }}
              >
                <CoinLottie className="h-full w-full" />
              </div>
            </div>
          </div>

          {/* Drifting micro-particles */}
          {[
            { left: "8%", top: "30%", size: 3, color: "#fff" },
            { left: "82%", top: "18%", size: 4, color: "#9181f5" },
            { left: "88%", top: "62%", size: 3, color: "#5cd8ff" },
            { left: "14%", top: "74%", size: 4, color: "#ff7a90" },
            { left: "50%", top: "4%", size: 2.5, color: "#fff" },
            { left: "6%", top: "52%", size: 2.5, color: "#5cd8ff" },
            { left: "94%", top: "40%", size: 2, color: "#fff" },
            { left: "60%", top: "94%", size: 3.5, color: "#9181f5" },
          ].map((p, i) => (
            <span
              key={`drift-${i}`}
              data-drift
              aria-hidden
              className="absolute rounded-full will-change-transform"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                filter: `drop-shadow(0 0 ${p.size * 2}px ${p.color}cc)`,
                opacity: 0.8,
              }}
            />
          ))}

          {/* Satellite twinkling dots (smaller, foreground) */}
          <span
            data-twinkle
            aria-hidden
            className="absolute left-[42%] top-[6%] size-[3px] rounded-full bg-white"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))" }}
          />
          <span
            data-twinkle
            aria-hidden
            className="absolute right-[12%] top-[88%] size-1 rounded-full bg-white"
          />
        </div>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}
