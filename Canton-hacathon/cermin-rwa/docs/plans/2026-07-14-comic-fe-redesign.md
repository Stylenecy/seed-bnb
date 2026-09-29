# Comic FE Redesign — "The Comic Neobank"

User decision (2026-07-14): total FE redesign. The launch video's comic language becomes the
app's design language. Cermin won on Mezo because of its user journey — the FE must feel like a
living CONSUMER app, not an empty dashboard: eye-candy journey, comfort, personality.

## Global constraints (binding — copy into every dispatch)

1. **Palette & typography FROZEN**: semantic tokens in `frontend/src/index.css` (dark = beloved
   original; light stays working). Fraunces = display/numbers, Manrope = body. **Bangers** is
   added ONLY for comic-tag lettering (uppercase accents/onomatopoeia) — never body copy, never
   long strings. Load via Google Fonts `<link>` in index.html (family=Bangers).
2. **Comic kit vocabulary** (mirror the video's `comicFx`): halftone dot texture (very subtle,
   opacity ≤0.06), ink-frame cards (2–3px outline in a semantic ink color + hard offset shadow
   `4px 4px 0`, optional tilt −2..2° on ACCENT cards only — data tables/forms stay straight),
   speed-burst SVG accents, comic tags (Bangers, ink outline via -webkit-text-stroke + offset
   shadow), squash-stretch spring pops for state changes.
3. **Assets**: `frontend/public/comic/*.webp` — story panels s1-post s2-borrow s3-vault s4-watch
   s5-crash s6-saved, hook panels h1..h4, privacy p1-blind, mascot-watch, mascot-shield
   (mascots have ink-dark baked backgrounds: always composite on dark surfaces or behind a
   radial mask). All imagery `loading="lazy"` except the first viewport, explicit width/height
   or aspect-ratio (CLS), `alt` text.
4. **The mascot is the journey guide**: onboarding narrator, dashboard companion whose pose/copy
   reacts to health status (protected/guarded/action), empty-state teacher, rescue celebrant.
   Copy stays FIRST-PERSON CERMIN, short, warm.
5. **Micro-interactions**: button press = tiny scale feedback; stat change = squash-stretch pop;
   faucet claim = brief coin-particle burst; rescue restored = one "SAVED!" comic burst moment
   (subtle, ≤1.2s, no confetti library); ALL gated behind `prefers-reduced-motion` (existing
   global rule already kills transitions — new JS-driven animations must check it too).
6. **Nothing functional breaks**: all vitest suites pass (176+, add tests for new pure logic),
   `npm run build` + oxlint clean, mock mode (demo parachute) byte-equivalent in BEHAVIOR,
   backend mode untouched (isBackendMode gates, poll ≥3s, live origination flow), math stays
   single-source in `lib/health.ts`, router hashes unchanged, Vercel deploy still works.
7. **a11y & responsive**: keep WCAG AA contrast (comic outlines must not drop text contrast),
   44px touch targets, focus states, mobile bottom-nav layout intact; no horizontal scroll at
   375px; test both themes. Light theme: ink outline maps to the dark ink token (not white).
8. Conventional commits. Screenshot-verify (Playwright + system Chrome) both themes + 375px for
   every screen touched, and LOOK at the screenshots before reporting.

## Tasks

- **Task A — Comic UI kit + Dashboard reference** (`frontend/src/lib/comic/` components:
  Halftone, InkCard, ComicTag, SpeedBurst, Mascot, CoinBurst, SavedBurst; Bangers wiring;
  then redesign Dashboard as the reference implementation: comic hero ring card, mascot
  companion with status reactions, ink-framed chart card, comic-tag section labels, stat pops).
- **Task B — Entry journey**: Landing (comic hero with panels, how-it-works as comic strip,
  privacy split-panel section reusing p1-blind + s3-vault, comic CTAs), Onboarding (3 slides
  become comic panels with mascot narration), Connect (comic card, mascot welcome).
- **Task C — App journey**: Borrow wizard (comic step crumbs, strategy cards as comic cards,
  confirm moment), Vault (war-chest framing, coin flow accent), Simulate (comic "market lab",
  CRASH!/SAVED! moments), NavBar/bottom-nav comic touches, faucet coin burst, rescue
  celebration wired to the real rescue event in the feed.

Each task: implementer (opus) → review gate (sonnet) → fix loop → merge. Worktree isolation.
