import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicTag, InkCard, Mascot, SpeechBubble, type MascotPose } from '../lib/comic';

export interface Slide {
  title: string;
  body: string;
}

// Exactly the three slides from docs/03-ux.md ("Post your assets" -> "Fund
// your Shadow Vault" -> "Sleep well"), in Cermin's first-person voice.
// Exported (Task 19) so the Landing page's "How it works" section can share
// this EXACT copy instead of drifting from a second, hand-typed copy.
export const SLIDES: Slide[] = [
  {
    title: 'Post your assets',
    body: "Bring your tokenized Treasury on-chain and I'll hold it as collateral, so you can borrow without selling.",
  },
  {
    title: 'Fund your Shadow Vault',
    body: "Set aside a reserve only you control. It's your safety net — the lending pool can't touch it.",
  },
  {
    title: 'Sleep well',
    body: 'If the market dips, I repay from your vault automatically. No margin calls. No liquidation.',
  },
];

// The comic panel + narrator pose that stages each slide (index-aligned to
// SLIDES). NOT exported — Landing shares only the SLIDES copy, never this
// presentation. Each panel is a 16:9 story illustration from public/comic/.
const PANELS: { src: string; alt: string; pose: MascotPose }[] = [
  {
    src: '/comic/s1-post.webp',
    alt: 'A borrower placing a glowing tokenized Treasury seal on a marble bank counter',
    pose: 'watch',
  },
  {
    src: '/comic/s3-vault.webp',
    alt: 'A vault of shadow money that only the borrower controls',
    pose: 'watch',
  },
  {
    src: '/comic/s6-saved.webp',
    alt: 'A borrower sleeping soundly while Cermin quietly repays the loan during a market dip',
    pose: 'shield',
  },
];

interface OnboardingProps {
  onDone: () => void;
}

/** Screen 1 — 60 seconds, three narrated comic panels, then a mock "connect
 * party" step. Each slide is a big InkCard panel with Cermin standing in the
 * corner and telling you the step from a speech bubble; the copy is unchanged
 * (shared with Landing via SLIDES). No forms beyond that. */
export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const panel = PANELS[step];

  return (
    <div className="bg-cermin-atmosphere flex min-h-dvh items-center justify-center px-6 py-14">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" className="fill-surface-sunken" />
            <circle cx="24" cy="24" r="15" stroke="var(--color-gold)" strokeWidth="2.4" />
            <circle cx="24" cy="24" r="4.5" fill="var(--color-gold)" />
          </svg>
          <span className="font-display text-2xl text-foreground">Cermin</span>
        </div>

        {/* The comic panel: a framed illustration up top, then Cermin narrating
            the step from a speech bubble beside him. The image + title + speech
            swap together on step change; the dots and controls below stay put. */}
        <InkCard as="section" noPadding className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <img
                src={panel.src}
                alt={panel.alt}
                width={1376}
                height={768}
                loading={step === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-44 w-full object-cover sm:h-56"
              />
              <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-7">
                <h1>
                  <ComicTag size={36} rotate={-1} className="block">
                    {slide.title}
                  </ComicTag>
                </h1>
                <div className="mt-5 flex items-start gap-3 sm:gap-4">
                  <Mascot pose={panel.pose} size={76} loading={step === 0 ? 'eager' : 'lazy'} className="mt-1 shrink-0" />
                  <SpeechBubble tail="left" tailOffset="26px" className="flex-1 text-left">
                    <p className="text-sm leading-relaxed text-foreground-muted">{slide.body}</p>
                  </SpeechBubble>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </InkCard>

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
          {SLIDES.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-gold' : 'w-1.5 bg-hairline-strong'
              }`}
            />
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex min-h-11 items-center rounded-full px-4 py-2 text-sm text-foreground-faint transition-colors hover:text-foreground-muted disabled:opacity-0"
          >
            Back
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onDone}
              className="flex min-h-11 items-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              Connect &amp; enter
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
              className="flex min-h-11 items-center rounded-full bg-surface-overlay px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-overlay-strong"
            >
              Next
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-foreground-faint">
          LocalNet · Mock data — nothing here touches a real wallet.
        </p>
      </div>
    </div>
  );
}
