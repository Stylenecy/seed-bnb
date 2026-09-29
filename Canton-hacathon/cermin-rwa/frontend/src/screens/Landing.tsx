import { computeHealthRatioBps, defensePrice, healthStatus, protectionFloorPrice, targetBpsForTriggerBps } from '../lib/health';
import { seedPriceHistory } from '../lib/priceHistory';
import { PriceChart } from '../components/PriceChart';
import { ThemeToggle } from '../components/ThemeToggle';
import { SLIDES } from './Onboarding';
import { ComicTag, InkCard, Mascot, SpeedBurst } from '../lib/comic';

interface LandingProps {
  onLaunch: () => void;
}

/**
 * Task 19 — the public landing page at `/`. Judges' first impression: sells
 * the product in one scroll, then hands off to the app via "Launch app".
 * Task B (comic redesign) restages it in the app's comic language: an inked
 * hero with a status stamp + speed-burst, story panels for the problem/solution
 * and the how-it-works strip, and a blindfolded-pool aside on the privacy row.
 *
 * Deliberately has NO dependency on the store or the backend client — it
 * never reads a session, never polls, never makes a ledger call. That's not
 * just a runtime behavior, it's an architectural guarantee: grep this file
 * and there is no `useCerminStore` / `lib/backend` import to find. The one
 * exception is `onLaunch`, a plain callback the caller (App.tsx) wires up.
 * (The comic kit it imports is pure presentation — no store, no ledger.)
 */

// The canonical demo scenario (STATE.md §2, "Demo numbers (everywhere)") —
// used only to draw the hero's illustrative chart, so the two dashed lines
// it shows are the same numbers every other screen already reasons about,
// not invented ones. Computed once at module load (pure functions, no
// randomness beyond the deterministic seeded backfill in `seedPriceHistory`).
const HERO_COLLATERAL_FACE = 10_000;
const HERO_OUTSTANDING = 6_000;
const HERO_VAULT_BALANCE = 1_500;
const HERO_TRIGGER_BPS = 13_000;
const HERO_DEFENSE_PRICE = defensePrice(HERO_OUTSTANDING, HERO_TRIGGER_BPS, HERO_COLLATERAL_FACE);
const HERO_FLOOR_PRICE = protectionFloorPrice(HERO_OUTSTANDING, HERO_VAULT_BALANCE, HERO_TRIGGER_BPS, HERO_COLLATERAL_FACE);
const HERO_CHART_POINTS = seedPriceHistory(1.0);
// Task 20 — the chart now needs the same healthStatus classification the
// rest of the app derives (never a new one): at $1.00 against this
// outstanding/trigger this is comfortably 'protected', so the hero always
// renders in its calm, non-breach styling.
const HERO_STATUS = healthStatus(
  computeHealthRatioBps(HERO_COLLATERAL_FACE * HERO_CHART_POINTS[HERO_CHART_POINTS.length - 1].price, HERO_OUTSTANDING),
  HERO_TRIGGER_BPS,
  targetBpsForTriggerBps(HERO_TRIGGER_BPS),
);

interface PrivacyRow {
  label: string;
  poolVisible: boolean;
  pool: string;
  you: string;
}

// The control matrix. On Canton this was a privacy matrix (the pool never SAW
// the vault/policy/rescues). On BNB Chain all contract state is public, so the
// honest claim is about CONTROL: the pool is the counterparty on the loan, but
// the CerminRWA contract gives it no way to touch your vault, policy or rescues.
const PRIVACY_ROWS: PrivacyRow[] = [
  { label: 'Your loan', poolVisible: true, pool: "It's the counterparty", you: 'Always yours' },
  { label: 'Your Shadow Vault', poolVisible: false, pool: "Can't touch it", you: 'Always yours' },
  { label: 'Your Guard Policy', poolVisible: false, pool: "Can't touch it", you: 'Always yours' },
  { label: 'Every rescue', poolVisible: false, pool: "Can't trigger it", you: 'Always yours' },
];

// The how-it-works comic strip: the three onboarding steps, each staged as a
// panel illustration + a big comic step numeral. Copy stays shared with the
// real onboarding flow (SLIDES), only the pictures live here.
const HOW_PANELS: { src: string; alt: string; tilt: number }[] = [
  { src: '/comic/s1-post.webp', alt: 'A borrower placing a glowing tokenized Treasury seal on a marble bank counter', tilt: -2 },
  { src: '/comic/s3-vault.webp', alt: 'A vault of shadow money only the borrower controls', tilt: 1.5 },
  { src: '/comic/s4-watch.webp', alt: 'Cermin the mirror-guardian keeping quiet watch over the position', tilt: -2 },
];

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
    <path d="M4 12.5 9.5 18 20 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EYE_SLASH_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
    <path
      d="M3 3l18 18M10.6 5.4A9.9 9.9 0 0 1 12 5.3c5 0 8.8 4 9.5 6.2a11 11 0 0 1-2.8 4.1M6.5 6.8A11.3 11.3 0 0 0 2.5 11.5C3.2 13.7 7 17.7 12 17.7c1 0 2-.15 2.9-.4M9.9 10a2.6 2.6 0 0 0 3.6 3.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** The Cermin ring-and-dot wordmark, shared by the header and footer (same
 * mark as NavBar/Onboarding/Connect, just parametrized on size here since
 * this screen uses it twice at two sizes). */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="12" className="fill-surface-sunken" />
      <circle cx="24" cy="24" r="15" stroke="var(--color-gold)" strokeWidth="2.4" />
      <circle
        cx="24"
        cy="24"
        r="15"
        stroke="var(--color-sage)"
        strokeWidth="2.4"
        strokeDasharray="60 200"
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <circle cx="24" cy="24" r="4.5" fill="var(--color-gold)" />
    </svg>
  );
}

function LaunchButton({ onLaunch, className = '' }: { onLaunch: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onLaunch}
      className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90 ${className}`}
    >
      Launch app
    </button>
  );
}

export function Landing({ onLaunch }: LandingProps) {
  return (
    <div className="bg-cermin-atmosphere min-h-dvh">
      {/* Cheap, real skip-link: invisible until keyboard-focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-gold"
      >
        Skip to main content
      </a>

      {/* Landing's OWN minimal header — the NavBar (top pills + mobile tabs)
          only ever renders inside the app screens below `#/app/...`. */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface-app/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-xl text-foreground">Cermin</span>
          </div>

          <nav aria-label="Landing" className="hidden md:block">
            <a href="#how-it-works" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <LaunchButton onLaunch={onLaunch} />
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* 1. Hero — the tagline, the pitch, an inked comic chart, and a status
            stamp bursting in on load. */}
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-gold-soft uppercase">Cermin-RWA · BNB Chain</p>

              {/* The comic stamp: "ZERO LIQUIDATIONS!" punching in over a
                  speed-burst on load (one-shot, reduced-motion aware — the
                  burst wrapper's pop animation is neutralized under
                  prefers-reduced-motion, leaving the stamp simply present). */}
              <div className="relative mt-5 inline-block">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-8 motion-safe:animate-[cermin-pop-in_0.7s_ease-out]"
                >
                  <SpeedBurst seed="hero-zero" color="var(--color-gold)" count={13} spread={44} opacity={0.32} className="h-full w-full" />
                </div>
                <ComicTag size={30} rotate={-4} color="var(--color-sage)" ariaHidden className="relative">
                  Zero liquidations!
                </ComicTag>
              </div>

              <h1 className="mt-4 font-display text-4xl leading-[1.1] text-foreground sm:text-5xl">
                Shadow money. Zero liquidations.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground-muted">
                I&apos;m Cermin — a guard for loans backed by tokenized real-world assets on BNB Chain. Post
                your collateral, fund a reserve only you control, and the moment your position needs help, I
                repay part of your loan myself. No margin call. No liquidation.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <LaunchButton onLaunch={onLaunch} className="min-h-12 px-7 py-3" />
                <a href="#how-it-works" className="text-sm font-semibold text-gold-soft hover:text-gold">
                  See how it works ↓
                </a>
              </div>

              {/* Cermin greets you right in the hero — the journey guide, in
                  first person, from the first screen. */}
              <div className="mt-9 flex items-center gap-3">
                <Mascot pose="watch" size={60} loading="eager" className="shrink-0" />
                <p className="text-sm leading-relaxed text-foreground-muted">
                  Hi — I&apos;m Cermin. I keep watch on your position so you don&apos;t have to.
                </p>
              </div>
            </div>

            <div>
              <InkCard>
                <PriceChart
                  points={HERO_CHART_POINTS}
                  defensePrice={HERO_DEFENSE_PRICE}
                  floorPrice={HERO_FLOOR_PRICE}
                  vaultBalance={HERO_VAULT_BALANCE}
                  status={HERO_STATUS}
                  showCaption={false}
                />
              </InkCard>
              <p className="mt-3 text-center text-xs text-foreground-faint">
                Illustrative — how I defend a position as price moves, for a sample loan.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Problem -> Solution, as two comic panels: the public-liquidation
            world vs. being saved while you sleep. */}
        <section className="border-y border-hairline bg-surface-raised/40">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-center font-display text-3xl text-foreground sm:text-4xl">
              Public liquidation isn&apos;t privacy. It&apos;s theater.
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              <InkCard noPadding tilt={-1.5} className="overflow-hidden">
                <img
                  src="/comic/h2-inpublic.webp"
                  alt="A borrower's loan exposed on a public square while onlookers watch the price fall"
                  width={1376}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  className="h-44 w-full object-cover sm:h-52"
                />
                <div className="p-6 sm:p-7">
                  <ComicTag size={20} rotate={-2} color="var(--color-terracotta)">
                    Out there
                  </ComicTag>
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                    On most public chains, your loan, your collateral, and the moment you slip are all visible
                    on-chain. When prices fall, everyone can see it happening — and some are watching for exactly that
                    moment.
                  </p>
                </div>
              </InkCard>

              <InkCard noPadding tilt={1.5} className="overflow-hidden">
                <img
                  src="/comic/s6-saved.webp"
                  alt="A borrower sleeping soundly while Cermin quietly repays the loan during a market dip"
                  width={1376}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  className="h-44 w-full object-cover sm:h-52"
                />
                <div className="p-6 sm:p-7">
                  <ComicTag size={20} rotate={-2} color="var(--color-sage)">
                    With Cermin
                  </ComicTag>
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                    On BNB Chain, I watch your Health Ratio around the clock. If it ever slips, I repay part of your
                    loan from your own reserve — automatically, before any margin call, and only when the contract
                    itself confirms you&apos;re below your trigger.
                  </p>
                </div>
              </InkCard>
            </div>
          </div>
        </section>

        {/* 3. How it works — the three onboarding slides as a comic strip. */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">How it works</h2>
            <p className="mt-3 text-sm text-foreground-muted">Three steps. Sixty seconds. No forms beyond what you need.</p>
          </div>
          <ol className="mt-12 grid grid-cols-1 gap-7 sm:grid-cols-3">
            {SLIDES.map((slide, i) => (
              <li key={slide.title} className="list-none">
                <InkCard noPadding tilt={HOW_PANELS[i].tilt} className="h-full overflow-hidden">
                  <img
                    src={HOW_PANELS[i].src}
                    alt={HOW_PANELS[i].alt}
                    width={1376}
                    height={768}
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-6 sm:p-7">
                    <ComicTag size={30} color="var(--color-gold)" ariaHidden>
                      {i + 1}
                    </ComicTag>
                    <h3 className="mt-2 font-display text-lg text-foreground">{slide.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{slide.body}</p>
                  </div>
                </InkCard>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. "Who sees what" — the privacy matrix, with a blindfolded-pool
            comic aside making the point before the data does. */}
        <section aria-labelledby="privacy-heading" className="border-y border-hairline bg-surface-raised/40">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="privacy-heading" className="font-display text-3xl text-foreground sm:text-4xl">
                Who sees what
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">
                The lending pool is the counterparty on your loan. That&apos;s it. Your reserve, your protection rules,
                and every rescue are yours — the pool has no way to touch them.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              {/* Illustrated aside: what the pool actually sees. */}
              <div>
                <InkCard noPadding tilt={-1.5} className="overflow-hidden">
                  <img
                    src="/comic/p1-blind.webp"
                    alt="A blindfolded lending-pool banker who cannot touch the borrower's reserve"
                    width={1376}
                    height={768}
                    loading="lazy"
                    decoding="async"
                    className="h-44 w-full object-cover sm:h-52"
                  />
                  <div className="p-6 sm:p-7">
                    <ComicTag size={19} rotate={-2} color="var(--color-gold)">
                      What the pool controls
                    </ComicTag>
                    <p className="mt-3 font-display text-3xl text-foreground">Nothing.</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                      Your reserve, your rules, and every rescue are gated by the contract to you and your Guard Agent.
                      The pool can&apos;t move what it was never given.
                    </p>
                  </div>
                </InkCard>
              </div>

              {/* The data, unchanged: a real <table> at md+, a stacked card
                  list below md (display:none swaps the accessibility tree too,
                  so this is a genuine responsive swap, not duplicated AT
                  content — and never a horizontal-scroll table on a phone). */}
              <div>
                <InkCard noPadding className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                    <caption className="sr-only">Who can act on your position</caption>
                    <thead>
                      <tr className="border-b border-hairline">
                        <th scope="col" className="px-5 py-4 text-xs font-semibold tracking-wide text-foreground-faint uppercase">
                          On-chain
                        </th>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold tracking-wide text-foreground-faint uppercase">
                          Lending pool
                        </th>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold tracking-wide text-foreground-faint uppercase">
                          You + Cermin
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRIVACY_ROWS.map((row) => (
                        <tr key={row.label} className="border-b border-hairline last:border-0">
                          <th scope="row" className="px-5 py-4 font-medium text-foreground">
                            {row.label}
                          </th>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 ${row.poolVisible ? 'text-foreground-muted' : 'text-foreground-faint'}`}
                            >
                              {row.poolVisible ? CHECK_ICON : EYE_SLASH_ICON}
                              {row.pool}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sage">
                              {CHECK_ICON}
                              {row.you}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </InkCard>

                <div className="flex flex-col gap-3 md:hidden">
                  {PRIVACY_ROWS.map((row) => (
                    <InkCard key={row.label} noPadding className="p-5">
                      <p className="font-display text-base text-foreground">{row.label}</p>
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-xs tracking-wide text-foreground-faint uppercase">Lending pool</span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-right ${row.poolVisible ? 'text-foreground-muted' : 'text-foreground-faint'}`}
                          >
                            {row.poolVisible ? CHECK_ICON : EYE_SLASH_ICON}
                            {row.pool}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-xs tracking-wide text-foreground-faint uppercase">You + Cermin</span>
                          <span className="inline-flex items-center gap-1.5 text-sage">
                            {CHECK_ICON}
                            {row.you}
                          </span>
                        </div>
                      </div>
                    </InkCard>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Built on BNB Chain + honest hackathon framing. */}
        <section aria-labelledby="chain-heading" className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-3 py-1 text-xs text-foreground-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            BNB Chain testnet
          </span>
          <h2 id="chain-heading" className="mt-5 font-display text-3xl text-foreground sm:text-4xl">
            Built on BNB Chain
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground-muted">
            Cermin-RWA runs as a Solidity contract on BNB Smart Chain: the Guard Agent can only repay from your
            Shadow Vault when the contract itself recomputes your Health Ratio and finds it below your trigger.
            Note: BNB Chain is a public chain, so positions are publicly readable on-chain. Your collateral
            here is a mock tokenized Treasury (ERC-20 mUST) and loans are in a mock stablecoin (mUSD).
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-xs text-foreground-faint">
            Originally built for the Build on Canton Hackathon (Encode Club), Track 1 — Private DeFi &amp; Capital
            Markets, and ported to BNB Chain. This is a hackathon build targeting BSC testnet, not a production
            deployment.
          </p>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <div>
              <p className="font-display text-sm text-foreground">Cermin-RWA</p>
              <p className="text-xs text-foreground-faint">
                Originally: Build on Canton Hackathon (Encode) · now on BNB Chain
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-foreground-faint">Source &amp; docs in this repository</span>
            <button type="button" onClick={onLaunch} className="text-sm font-semibold text-gold-soft hover:text-gold">
              Launch app →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
