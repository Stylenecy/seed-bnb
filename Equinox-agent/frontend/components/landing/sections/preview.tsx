"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { CircleCheck, Sparkles, FileLock, Clock, BrainCircuit } from "lucide-react";
import { preview } from "@/lib/content";
import { SectionHeading } from "../ui/section-heading";
import { Badge } from "../ui/badge";

const reviewers = [
  {
    name: "Alice",
    role: "Group Founder",
    weight: "1.20×",
    verdict: "APPROVE",
    confidence: 0.88,
    note: "Deposit pattern matches member's typical cadence; emergency claim consistent with onchain timestamp.",
  },
  {
    name: "Bob",
    role: "Trusted Member",
    weight: "1.10×",
    verdict: "APPROVE",
    confidence: 0.81,
    note: "Cross-group lookup clean. Reason hash plausible. No outstanding debts.",
  },
  {
    name: "Charlie",
    role: "Member",
    weight: "1.00×",
    verdict: "APPROVE",
    confidence: 0.74,
    note: "Light flag on amount vs. average withdrawal — overridden by reputation score 812.",
  },
];

export function Preview() {
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
        duration: 0.9,
        scrollTrigger: { trigger: ref.current, start: "top 70%" },
      });

      gsap.to(".float-a", {
        y: -8,
        repeat: -1,
        yoyo: true,
        duration: 4,
        ease: "sine.inOut",
      });
      gsap.to(".float-b", {
        y: 10,
        repeat: -1,
        yoyo: true,
        duration: 5,
        ease: "sine.inOut",
      });
    },
    { scope: ref }
  );

  return (
    <section id="preview" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <SectionHeading
          eyebrow={preview.eyebrow}
          title="Watch a withdrawal pass"
          italic="through the protocol."
          body={preview.body}
          tone="violet"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Requester Agent panel */}
          <div data-anim="fade-up" className="float-a">
            <div className="rounded-[1.4rem] border border-border-strong bg-surface/85 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-violet/15 text-violet-soft">
                    <BrainCircuit className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                      Tier 1 · Requester Agent
                    </p>
                    <p className="text-sm font-medium text-fg">Pre-validation verdict</p>
                  </div>
                </div>
                <Badge tone="emerald">PASS</Badge>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-bg/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                    Confidence
                  </p>
                  <p className="font-mono text-sm text-emerald-soft">0.92</p>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet via-cyan to-emerald"
                    style={{ width: "92%" }}
                  />
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { label: "Deposit consistency", value: "100% · 3/3", weight: "25%" },
                  { label: "Reputation score", value: "812 / 1000", weight: "25%" },
                  { label: "Cross-group history", value: "2 groups · clean", weight: "15%" },
                  { label: "Reason plausibility", value: "Medical · verified", weight: "15%" },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-4 border-t border-border pt-3 first:border-0 first:pt-0"
                  >
                    <div className="flex items-center gap-2 text-fg-muted">
                      <CircleCheck className="size-4 text-emerald-soft" />
                      <span>{row.label}</span>
                    </div>
                    <div className="flex items-baseline gap-3 text-right">
                      <span className="text-xs text-fg-dim">{row.weight}</span>
                      <span className="text-fg">{row.value}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-violet/20 bg-violet/[0.06] px-4 py-3">
                <div className="flex items-center gap-2 text-fg-muted">
                  <Sparkles className="size-4 text-violet-soft" />
                  <span className="text-sm">Routing decision</span>
                </div>
                <span className="text-xs font-medium text-violet-soft">
                  HYBRID_FAST_TRACK
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-bg/40 px-4 py-3">
                <div className="flex items-center gap-2 text-fg-muted">
                  <FileLock className="size-4 text-fg-muted" />
                  <span className="text-sm">Reasoning CID</span>
                </div>
                <span className="font-mono text-[11px] text-fg-dim">
                  bafy…h7c4
                </span>
              </div>
            </div>
          </div>

          {/* Reviewer agents panel */}
          <div data-anim="fade-up" className="float-b">
            <div className="rounded-[1.4rem] border border-border-strong bg-surface/85 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-emerald/15 text-emerald-soft">
                    <BrainCircuit className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                      Tier 2 · Reviewer Agents
                    </p>
                    <p className="text-sm font-medium text-fg">Live voting · 11h 42m left</p>
                  </div>
                </div>
                <Badge tone="violet">3 / 4 approved</Badge>
              </div>

              <div className="mt-6 space-y-3">
                {reviewers.map((r) => (
                  <article
                    key={r.name}
                    className="rounded-2xl border border-border bg-bg/40 p-4 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet/30 to-emerald/20 text-sm font-medium text-fg">
                          {r.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-fg">{r.name}</p>
                          <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                            {r.role} · {r.weight}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-soft">
                        {r.verdict}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                      {r.note}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-fg-dim">
                      <span>Confidence {r.confidence.toFixed(2)}</span>
                      <span className="font-mono">vote cast onchain</span>
                    </div>
                  </article>
                ))}

                <div className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-transparent px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-amber" />
                    <span className="text-sm text-fg-muted">Eko · awaiting agent</span>
                  </div>
                  <span className="text-xs text-amber">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-fg-dim">
          Mockup — final UI runs against ink! contracts on Portaldot. POT pays every transaction.
        </p>
      </div>
    </section>
  );
}
