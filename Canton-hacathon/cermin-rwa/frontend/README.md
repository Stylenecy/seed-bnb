# Cermin — Frontend

The neobank-style dashboard for Cermin-RWA: a serene Health Ratio ring, three
position cards, and Cermin's activity feed. See `docs/03-ux.md` for the full
UX spec and `.superpowers/sdd/global-constraints.md` for the demo numbers and
Health Ratio formula this app is built against.

Stack: Vite + React + TypeScript + Tailwind CSS v4 + Zustand + Framer Motion.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

By default the app runs entirely against an in-memory mock store
(`src/store.ts`) seeded with the demo numbers — no ledger, backend, or network
calls required. Set `VITE_API_URL` (e.g. `http://localhost:3001`, see
`docs/06-demo-runbook.md` Mode B) to poll the live backend bridge instead;
the component layer is unchanged either way, since components only ever read
through the store's selectors.

## Other scripts

```bash
npm run build      # tsc -b && vite build — must pass before committing
npm run test       # vitest run — store math tests (trigger + repay-to-target)
npm run test:watch # vitest in watch mode
npm run lint       # oxlint
npm run preview    # preview the production build
```

## Project layout

```
src/
  lib/
    health.ts      # pure Health Ratio math (mirrors the Daml formula 1:1)
    health.test.ts # vitest coverage of the demo rescue scenario + edge cases
    format.ts       # currency/percent/date formatting helpers
    router.ts       # the 5-screen union type + tiny hash router
    backend.ts      # optional backend-polling mode (live only when VITE_API_URL is set)
  store.ts          # Zustand store: demo-seeded state + ledger-shaped actions
  store.test.ts     # integration tests wiring the store to the math
  components/
    Card.tsx         # the one card shape used everywhere
    PrivacyBadge.tsx  # "Only you can see this" — the privacy tell
    HealthRing.tsx    # the hero: a serene ring, not a screaming gauge
    ActivityFeed.tsx  # Cermin's first-person "story stream"
    NavBar.tsx        # quiet screen switcher
    Toggle.tsx        # the quiet pill switch (Coupon Sweep)
  screens/
    Onboarding.tsx    # three slides: post assets → fund vault → sleep well
    Dashboard.tsx     # Home: Health Ratio ring + position cards + feed
    BorrowFlow.tsx    # 3-step borrow: amount → Guard Trigger + Coupon Sweep → confirm
    Vault.tsx         # Shadow Vault: balance, top-up/withdraw, runway, Coupon Sweep
    Simulate.tsx      # simulation mode: price slider, rescue + coupon fast-forward
```

## Design system

Calm, premium, private-banking — not a DEX. Deep ink surfaces, warm
parchment text, a muted gold accent, and status colors that never scream:
sage (Protected), amber (Guarded), warm terracotta (Action suggested) —
no stoplight red. Typography pairs Fraunces (display serif, used for every
number and heading) with Manrope (body). All tokens live in `src/index.css`
under Tailwind v4's `@theme` block — colors like `bg-ink-850` or
`text-terracotta` are generated automatically from those custom properties.

Status words are exact and driven by the policy's own thresholds (Amendment 3):
**Protected** (Health Ratio ≥ `targetRatioBps` — 145% with the demo numbers),
**Guarded** (between the Guard Trigger and the target), **Action suggested**
(below the Guard Trigger — 130% with the demo numbers).
