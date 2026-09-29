# Cermin-RWA Demo Video — Storyboard & Implementation Brief

> **BNB Chain version (2026-09-26, render `out/cermin-rwa-bnb.mp4`).** Same beat grid, comic panels,
> scene boundaries and music assembly as below. Changes: S2 bottom line "Cermin-RWA · Now on BNB Chain"
> (+ code-drawn BNB mark, `src/lib/BnbMark.tsx`), tagline "Your loan's on-chain guardian."; S3 "Fund a
> shadow vault."; S4/S4b re-cut over FRESH captures of the BNB frontend (`public/video/journey.mp4`,
> `yield.mp4` — BNB frontend + backend + Guard Agent on the REAL BSC testnet (chain 97, recorded
> 2026-09-27, user "maya"); 6,000 loan, 1,500 vault, $0.90 → $0.76 → guardRepay 758.62 → 145.0%, coupon
> sweep → 148.2%; one continuous take whose block-confirmation waits are speed-ramped) with re-timed
> callouts/camera/toasts;
> S5 is now CONTROL, not privacy ("What the pool can touch" → 0/0/0, "The pool can't touch it. The
> contract says so."); S5b stage 2 shows the Solidity CerminRWA contract on BSC and who can touch what,
> headline "Guard repays only below your trigger."; S6 is the real BSC testnet proof (CerminRWA
> 0x8651…64F2; this take's rescue tx 0xc139c19b… 5,241.38 @ 145.0%, sweep tx 0x1a654cbf… 5,128.88 @
> 148.18%, plus the earlier smoke-run 0x22f39dad… / 0x51259d1b…); S7 "Guarded RWA loans on BNB Chain."
> + BNB mark. Narration is a NEW 20-line edge-tts script (en-GB-RyanNeural, −12 LUFS) written for the
> BNB truth (control, trigger rule, Solidity contract, live testnet), every cue on the beat grid (see
> `src/lib/vo.ts`). The Canton-era text below is kept as history.

Remotion demo video for the Build on Canton Hackathon. **Beat-synced launch cut — 2:11 (131.4s).**
Fast-tempo startup-launch / product-ad style: **every cut, effect, and animation lands on the
music's beat grid** (128 BPM). Quick cuts, smooth camera zoom-in/out that follows the flow, spring
physics everywhere. **All on-screen text is English.**

## Hard specs

- 1920×1080, 30 fps, `durationInFrames = 3941` (≈131.4s / 2:11). One root composition id: `Main`.
- **v9 (current):** a NEW code-drawn explainer scene **S5b · UNDER THE HOOD** (money flow + Canton
  per-party contract delivery) is inserted after S5 privacy, and the close now rides the track's REAL
  outro. This required a **third music part** (part C): 10 bars are inserted at `barC(23)=2876`
  (= the old S6 start = `barB(27)` = SEAM2), so S6/S7 shift ~9.3s later. See `beat.ts`.
- **v5:** S4 is the COMPLETE user journey over `public/video/journey.mp4` (sign-in → faucet →
  borrow + Coupon Sweep → fund vault → crash → automatic rescue back to green) plus `S4bYield` over
  `public/video/yield.mp4` (coupon swept into the loan); S7 closes with "Private DeFi on Canton Network."
  (no hackathon credit). Frame ranges quoted below for S4–S7 are historical (v3/v4); `src/Main.tsx` +
  `src/lib/beat.ts` are the source of truth.
- **Timing is derived entirely from `src/lib/beat.ts`** (the single source of truth): `FPS=30`,
  `BPM=128`, `BEAT_S=0.46875` (14.0625f), `BAR_S=1.875` (56.25f), first beat `OFFSET_S=0.238`,
  `SEAM_FRAME=2088`, `B_MUSIC_START_S=24.61`, `SEAM2_FRAME=2876`, `C_MUSIC_START_S=43.363`. Helpers
  `barA(k)`, `barB(k)`, `barC(k)`, `beatA(k)`, `beatB(k)`, `beatC(k)` return comp frames; every scene
  boundary, TransitionSeries duration, text beat, node activation, footage cut, stat pop and toast
  entrance is a `barA/barB/barC/beat*` expression (± a named small lead-in).
- Look = the Cermin frontend, exactly. Dark theme tokens (from `frontend/src/index.css`):
  - surfaces: app `#0a0c10` · raised `#171a21` · sunken `#1c1f27` · overlay `#262a34`
  - text: `#f3ede2` · muted `#c9c2b4` · faint `#8b8778`
  - accent gold `#c9a869` · gold-soft `#e4cf9d` · on-gold `#0a0c10`
  - status: sage `#8fc39b` · amber `#dba75c` · terracotta `#d68a6c`
  - hairline `rgba(243,237,226,0.08)`, card shadow `0 20px 40px -24px rgba(0,0,0,0.6)`
  - Atmosphere bg: `#0a0c10` + faint radial gold glow top-left + faint sage glow top-right
    (`radial-gradient(60% 50% at 12% 0%, rgba(201,168,105,0.10), transparent 60%)` etc.)
- Fonts: **Fraunces** (display/serif, headlines) + **Manrope** (sans, body/labels) via
  `@remotion/google-fonts/Fraunces` and `@remotion/google-fonts/Manrope`. Numbers: tabular-nums.
  **Bangers** (`FONT_COMIC`, via `@remotion/google-fonts/Bangers`) is used ONLY for the in-scene
  comic lettering / onomatopoeia (`src/lib/ComicText.tsx`) — never for brand copy.

### Animated-comic visual language (S1 · S3 · S4c · S5)

S1, S3, the S4c mechanism chart and S5 are the **comic** act. S1/S3 fly the camera THROUGH illustrated
**comic panels** (`public/images/comic/`, flat 2D ink/gold/parchment/terracotta, halftone shading, no
baked text); S4c is a **code-drawn** comic-styled chart (ink-framed panel, halftone overlay, wobbled
ink-weight lines, Bangers labels); S5 is a **split-panel comparison** of two existing panels. Lettering
LIVES INSIDE the art via `ComicText`: uppercase Bangers,
parchment/gold fill with a thick ink (`#0a0c10`) outline + hard offset shadow, per-word rotation and
a `perspective`/`rotate`/`skew` tilt so the words sit ON the art's diagonals (rays, monitor rows,
speed-lines, binocular gaze), a spring squash-stretch pop ON A BEAT, and a terracotta echo-ghost
`onomatopoeia` variant for slams ("CRASH!"). Panel hand-offs are **aperture match-cuts**: the camera
dives into a bright/dark element (the coin, teller spout, chest, lantern, sky crack, meter dial,
blank frame) while the next panel pulls back out of its own aperture — a whoosh per hand-off.
- Copy tone: first-person Cermin, calm, zero jargon, no scare words beyond the cold open.
  No confetti, no neon, no degen styling. This is a quiet private bank that moves fast.

**Shared comic FX helper (`src/lib/comicFx.tsx`).** One reused set so the designed
scenes read as one book: `<Halftone>` (newsprint dot overlay), `<InkFrame>` (thin comic
panel border inset, optional gold inner rule), `<SpeedBurst>` (hand-wobbled radial
speed-lines, scale-in on the pop), `<CoinDot variant="gold"|"cream">` (bond-seal coin —
gold disc + inner ring + centre dot; cream = parchment stablecoin), `inkTextStyle()`
(Bangers number/word with the ComicText ink stroke + hard offset shadow, for flow layout),
`<DriftDots>` (slow-drifting ink/gold motes). Used across S2 · S5b · S6 · S7 (S4c/S5b keep
their own scoped in-panel halftone).

## Motion language

- Springs (`spring()`) for every entrance; ease-out enter, ease-in exit; exits ~60% of enter duration.
- A reusable `<Camera>` rig: takes keyframes `{frame, x, y, scale}` and applies a smoothly
  interpolated `transform` to the whole scene — this is how all zoom-in/zoom-out shots work.
  Zoom INTO a point of interest, hold, zoom out. Never linear; use spring or bezier easing.
- An animated cursor (inline SVG pointer, ~28px, parchment with ink outline, subtle drop shadow)
  that springs to a target BEFORE the camera zooms there — the camera follows the cursor.
- Scene transitions via `@remotion/transitions` (`TransitionSeries`): the four impact gaps are
  **hard cuts on the downbeat**; two soft gaps use a **half-beat (7f)** fade/slide. Every scene's
  frame 0 lands on its bar.
- Text beats: word-level staggered rise+fade, tight — the beat lands ON its bar (slam beats use a
  small named lead so the animation completes exactly on the downbeat).

### Beat-intensity system (the whole video breathes with the track)

`beat.ts` carries a `SECTION_ENERGY` map (normalized RMS keyed by music-time) plus `energyAt(f)`,
`beatPhase(f)`, `isDownbeatAt(f)` and `compFramesAt(t)` (the seam-aware inverse of `musicTimeAt`).
`src/lib/Pulse.tsx` exposes:
- `<Pulse sceneStart={S} intensity shake glow>` — wraps each scene's main content group (S2 logo,
  S3 diagram, S4 footage, S5 columns, S6 stat wall, S7 wordmark) and scale-pulses it
  `1 → 1+0.012·intensity·energy` with a fast attack on each beat + half-beat decay, a downbeat
  brightness lift, and an energy-gated downbeat micro-shake (fires only when `energy > 0.85`; bigger
  in S1/S7, tiny in S4 so the live UI stays readable). `sceneStart` = the scene's `S` comp-frame so
  the scene-local `useCurrentFrame` still reads the shared (seam-continuous) energy grid.
- `<SectionFlashes/>` — mounted at the top of `Main` (true comp frames): 1-frame parchment flashes
  on the drops (music-time 7.74s and 45.24s) and terracotta on the big breaks (35.86s, 43.36s), each
  fanned out to every comp frame the music-time plays (Part A + Part B).
S3 adds an incident shake+terracotta-flash slam on the PEAK (barA(14)); S7's wordmark carries a
per-bar gold shimmer sweep through the max-energy close. The S1 hook uses its own bespoke, stronger
per-beat punch-ins rather than the generic Pulse.

## Audio — the video is cut to this track

Score: **`public/audio/bring-it-on-airstream-main-version-41938-01-18.mp3`** — 78.75s, **128 BPM**,
first beat at 0.238s. (The old `music.m4a` is deleted; all references removed.) Because the track is
shorter than the cut, it is assembled in **three parts joined by hard seams on shared bar
boundaries** so the beat phase stays continuous:

- **Part A** — music 0 → 69.60s over comp frames 0 → `SEAM_FRAME`=2088 (bar 37). `<Audio>` from 0,
  no trim, volume 0.9 (fade-in over 12f).
- **Seam 1 @ 2088** — hard cut to **music-time 24.61s** (bar 13, mid-build): reads as "act 2." A
  4-frame audio crossfade (Part A tapers out, Part B fades in) hides any click.
- **Part B** — `<Audio trimBefore=738>` (24.61s) rides the peak to **seam 2** at comp 2876
  (music-time ~50.88s).
- **Seam 2 @ 2876 (`SEAM2_FRAME` = `barC(23)` = `barB(27)`)** — hard cut BACK to **music-time
  43.363s** (bar 23, the pre-DROP-2 break) so the tech/close act opens on a breath and DROP 2 lands
  one bar in (`barC(24)`=2932). Same 4-frame crossfade.
- **Part C** — `<Audio trimBefore=1301>` (43.363s) plays through the track's REAL ending at 78.75s;
  the outro fades from ~71.4s and the visuals fade to ink with it (a short safety fade in `partCVol`
  guarantees clean silence), landing together at **3941** (~2:11).
- Music leads at **volume 0.9**. Energy landmarks reused for sync: DROP 1 = bar 4 (7.74s), PEAK =
  bar 14 (26.5s), breaks at bars 19/23, DROP 2 = 45.24s (lands at `barC(24)` in part C), max-energy
  from bar 29 (in part B) and again through the outro build in part C (S6/S7).

SFX are **ducked (~0.35–0.45)** so the music leads — resolve extension at build time; a
`scripts/placeholders.mjs` still generates silent placeholders for any missing file:

- `sfx/whoosh.*` on every scene cut / camera move (0.4)
- `sfx/click.*` on node/stat activations + visible click-ripples (0.4)
- `sfx/chime.*` on success beats — logo reveal, restore, rescue toast (0.45)
- `sfx/riser.*` only into the S1 crash and the S3 incident (0.4). **Dropped in S4** — the music's
  own build does that job now.

## Assets (already in `public/`)

Screenshots (3840×2160 PNG unless noted — captured at DPR2, safe to zoom to 2×):
`screens/landing-hero.png`, `landing-full.png` (3840×~8600 full page), `onboarding-1.png`,
`dashboard-healthy.png`, `dashboard-healthy-full.png`, `dashboard-warning.png`,
`dashboard-rescued.png`, `dashboard-rescued-full.png`, `borrow-top.png`, `borrow-strategies.png`,
`vault.png`, `simulate-before.png`, `simulate-after.png`,
`mobile-landing.png`, `mobile-dashboard.png` (1170×2532, DPR3).
**Read the PNGs to choose exact zoom targets before animating them.**

Mascot images (Pixar-style, square, ink background — may still be generating; placeholders OK):
`images/mascot-watch.png` (guardian with lantern), `images/mascot-shield.png` (guardian defending a vault).
Composite them as friendly accents (logo reveal, privacy scene, closing) — masked with a soft
radial fade so the square edge never shows against the background.

Comic panels (2752×1536 webp, flat 2D ink/gold/parchment/terracotta, halftone, **no baked text**,
~1.4× zoom headroom — used full-bleed in S1/S3/S5). Loaded via `assets.comicImg(name)`:
- **S1 hook (h1–h4):** `h1-tokenized` (giant gold bond-seal coin held up by reaching hands, gold
  rays), `h2-inpublic` (dark trading floor, terracotta monitors, panicked silhouettes), `h3-onedip`
  (vault door cracking, terracotta light burst, tiny fleeing figure), `h4-liquidation` (candlestick
  towers collapsing with explosion speed-lines — THE drop panel).
- **S3 strip (s1–s6):** `s1-post` (borrower places a gold coin on a bank counter), `s2-borrow`
  (coins stream from a brass teller), `s3-vault` (mirror-guardian + borrower fill a hidden chest),
  `s4-watch` (guardian alone on a watchtower, lantern high), `s5-crash` (guardian deflects a
  terracotta chart-meteor, speed-lines), `s6-saved` (guardian pours coins into a loan-meter, needle
  back in the gold zone, borrower asleep).
- **S5 opener (p1):** `p1-blind` (top-hat banker peering through binoculars at a wall of EMPTY frames).

(The old photographic `images/hook/*.webp` stills were removed in the animated-comic pass.)

## Scenes (frame-accurate — all boundaries are bars)

Scene map (comp frames, from `tokens.ts`): **S1** 0→401 · **S2** 401→457 · **S3** 457→851 ·
**S4a** 851→2088 · **[SEAM 1]** · **S4b** 2088→2257 · **S4c** 2257→2594 · **S5** 2594→2876 ·
**S5b** 2876→3439 · **[SEAM 2]** · **S6** 3439→3720 · **S7** 3720→3941. All gaps are **hard cuts**
that land the incoming scene on the downbeat EXCEPT S5→S5b, which uses a half-beat (7f) slide (the
same slide that used to lead into S6 — unmoved in comp time because `barC(23)`===`barB(27)`=2876).
Scene lengths live in `tokens.ts` (`SCENE_START`/`SCENE_DUR`), computed from the beat grid.

### S1 · Cold-open HOOK — the problem, ANIMATED COMIC (0 → barA(7)=401, ~13.4s)
No introduction — a beat-cut comic that STATES THE PROBLEM, framed 2.39:1 (letterbox snaps away on
the hard cut at bar 7). Uses the four comic HOOK panels (`h1..h4`) full-bleed with per-beat
scale-punch-ins, and `ComicText` lettering laid ALONG each panel's diagonals. All cuts computed off
`beatA/barA` (S1 starts at comp 0, so a local frame IS a comp frame):
- **Bars 0–1 (7→120)** `h1-tokenized` (coin + reaching hands), slow push + a scale-punch on every
  beat. Lettering along the gold rays: "YOUR TREASURY." (bar 0) → "TOKENIZED. ON-CHAIN." (bar 1).
- **Bar 2 (120→176)** cut to `h2-inpublic`, smash-pan across the crashing monitors.
  Lettering tilted along the monitor rows: "YOUR LOAN. IN PUBLIC."
- **Bar 3 (176→232)** `h3-onedip` (vault crack, terracotta light-gap), shake ramping into the drop;
  a punch on **every beat**. Word stabs step DOWN the light-gap: "ONE" · "PRICE" · "DIP…" (amber).
- **DROP barA(4)=232** SLAM to `h4-liquidation` — 1-frame parchment flash, hard punch-in
  (scale 1.28→1.1 spring), screen shake (±8px, ±0.4°, decaying over the bar), terracotta vignette.
  Onomatopoeia slam along the explosion speed-lines: "PUBLIC LIQUIDATION." (terracotta echo).
- **Bars 4–7 (232→401)** rapid aftermath — cuts every beat across `h4-liquidation` / `h2-inpublic`
  (+ a tight `h4` zoom on the vanishing point), each a distinct punch; 2-frame terracotta strobe
  flashes ON beats. Closing lettering: "SOLD. IN FRONT OF EVERYONE." → the pivot "IT DOESN'T HAVE TO
  BE THIS WAY." (gold-soft).
At barA(7)=401 everything HARD-CUTS to ink → the S2 logo lands as the answer in the breakdown.
SFX kept sparse (music carries it): one riser into the drop, one whoosh on the slam.

### S2 · Logo reveal — the answer (barA(7)=401 → barA(9)=513, ~3.7s)
Cut to clean ink. The Cermin mark (gold ring + centered gold dot, like the app's logo) springs in,
then "Cermin" in Fraunces beside it; below, Manrope, muted: "Your loan's private guardian."
Reveals INSIDE the quiet breakdown (bars 7–8): mark + wordmark on bar 7 (chime on beat 29), gold
shimmer sweeps as the build re-enters on bar 8. Mascot-watch, gentle bob; faint bottom line
"Cermin-RWA · Canton Network".
**Designed (comicFx):** halftone texture, a thin ink comic frame (gold inner rule), and one gold
`SpeedBurst` snapping out radially behind the mark on the hard-cut pop — the same treatment family
as the S7 close, so the two brand beats bookend the film.

### S3 · How it works — ANIMATED COMIC STRIP (barA(9)=513 → barA(15)=851, ~11.3s)
Six comic panels (`s1..s6`), one per bar over the frozen window, each with a slow Ken-Burns push
(alive, never static) and integrated `ComicText`. Panels hand off with **aperture match-cuts** — the
camera dives into a bright/dark element of the outgoing panel while the next pulls back out of its
own aperture (whoosh per hand-off, ~12f). Landmarks (local, S = barA(9)):
- **s1 POST** bar 9 · `s1-post` · "POST YOUR TREASURY." → dive into the coin.
- **s2 BORROW** bar 10 · `s2-borrow` · "BORROW AGAINST IT." → dive into the teller spout.
- **s3 VAULT** bar 11 · `s3-vault` · "FUND A SECRET VAULT." → dive into the chest.
- **s4 WATCH** bars 12–13 (the vigil hold) · `s4-watch` · "I WATCH. EVERY 5 SECONDS." → dive into the lantern.
- **s5 CRASH** bar 14 — the **PEAK**: `s5-crash`, the incident SLAM (shake + terracotta flash kept)
  · "CRASH!" (jagged onomatopoeia, terracotta echo) → dive into the sky crack.
- **s6 SAVED** bar 14→15 tail · `s6-saved` · "SAVED. WHILE YOU SLEPT." (chime), gentle push toward
  the meter dial, then hard-cut to the live app.
(The old FE-card node diagram + incident health-ring card were replaced by this strip; the real
demo numbers now live in S4/S6.)

### S4 · The product — a REAL live session (barA(19)=1076 → barA(37)=2088, ~33.7s)
Re-cut so **every footage cut lands on a bar** (bars 19–37) and the action maps to the music:
landing + launch-click + onboarding fill the bar-19 break (bars 19–24); dashboard ring + chart
tooltip ride DROP 2 (bars 24–26); borrow slider + strategy cards (bars 26–27); the price-drag build
ends so the **RESCUE CLICK lands EXACTLY on barA(29)=54.61s** (local frame 562); the max-energy
section then carries the ring spring to 145.0%, the rescue toast (spring-in on bar 30 + chime) and
the notes-feed zoom (bars 29–35); ease out bars 35–37 into the seam. Segment `trimBefore`/
`playbackRate` (0.38–1.5×) tuned to hit each bar; riser dropped (music covers it). Both Cermin-RWA
toasts kept; Toast A springs in on bar 23.

**Rebuilt around `public/video/session.mp4`** — a silent 57.6s scripted screen recording of the
actual app (dark theme) with a parchment cursor + gold click-ripples baked in. Instead of static
screenshots, S4 cuts that footage into fast segments (`<OffthreadVideo>` via `trimBefore`/`trimAfter`,
`playbackRate` up to 1.5 on slow stretches). The `<Camera>` rig FOLLOWS THE ACTION — the cursor is
in the footage, so the camera zooms toward whatever it's doing. Full-bleed throughout: a
`coverVid()` clamp keeps every keyframe's focus far enough from the edges that no video edge / black
ever enters frame. Hard cuts, whoosh on each cut. Segment order (source seconds → beat):
1. Landing → click "Launch app" (0.3–3.6s). Caption "This is the real app." (click SFX on the ripple)
2. Onboarding flash, sped 1.5× (3.6–5.7s).
3. Dashboard loads — health ring settles at 166.7% Protected (8.4–12s). Caption "One number that
   matters." **Toast A** springs in: *Cermin-RWA · now — "Guard Agent is watching your position — every 5 seconds."*
4. Price chart — cursor rides the "Cermin defends · $0.78" line (12.6–15.4s).
5. Borrow — drag the amount, health preview updates live (18.5–23.7s, sped 1.2×).
6. Guard Trigger — strategy cards expand as they're picked (Balanced "Recommended" / Aggressive),
   26.5–31.5s. Caption "Pick a strategy, not a percentage." (click SFX)
7. Shadow Vault — $1,500 balance + "Only you can see this" (33.4–36s). Caption "Fund a reserve only you can see."
8. Simulate — drag the price down, ring cools 166.7 → Guarded (38.3–46s, sped 1.25×). Caption
   "Now drop the market." (riser under the build-up) → ring turns terracotta "Action suggested" at
   126.7% and the rescue button is clicked (46–47.5s, click SFX) → ring springs back to 145.0%
   Protected (47.5–49.5s). **Toast B** springs in (sage): *Cermin-RWA · now — "I stepped in — repaid
   $758.62 from your Shadow Vault. You're back at 145.0%."* + chime.
9. Home — rescued; the new rescue note lands at the top of "Cermin's notes", cursor hovers it, camera
   pushes to the notes feed (50.5–56s). Caption "Rescued. Automatically. Privately."

The in-app navbar in the footage says "Cermin" (recorded product UI — left as-is); all overlay
brand text (toasts, captions, wordmarks) uses the full name **Cermin-RWA**. The old
phone-frame mobile outro was dropped to keep the live-session energy end-to-end. All numbers are the
canonical demo numbers (166.7% → 126.7% → repay 758.62 → 145.0%).

**Caption system — COMIC CALLOUTS (latest, over `journey.mp4`).** The old uniform bottom-scrim
Manrope subtitle bar is GONE (user: "not visible enough, all at the bottom, not creative"). Each
step now gets a small COMIC CALLOUT — the shared `lib/Callout.tsx` (reuses `ComicText`: Bangers,
ink outline + hard offset shadow, spring squash-stretch pop; ~44–50px, 1–2 lines) plus a short
ink-outlined parchment/gold **pointer** (SVG speech-tail `tri` ⇄ curved-flick `dash`, aimed at the
control). Callouts are children of the `<Camera>`, so they live in the footage's CONTENT space
(1920×1080) and TRACK the UI as the camera drifts — the pointer always aims true. Each was placed
against an extracted footage frame + the camera's visible window at that local frame, so it lands in
empty DARK UI (never over the active control or cursor) and stays on-screen at the 1.03–1.15 zoom.
Region alternates (no two consecutive share a corner); pointer fill alternates gold ⇄ parchment;
motion = beat pop-in + ±3px idle float + pop-out ~half a bar before the next. Retimed to the REAL
footage step (the old captions ran ~½ bar behind). The 9 callouts (local frame · placement · aim):
THE REAL APP. (0 · lower-left · ↖ Launch app) · YOUR NAME = AN ON-LEDGER PARTY. (56 · right · ← name
input) · CLAIM TEST FUNDS. (138 · below · ↑ faucet button) · BORROW IN 3 STEPS. (197 · right · ←
amount slider) · A STRATEGY — NOT A PERCENTAGE. (337 · left · → strategy cards) · COUPON SWEEP ON.
(422 · right-lower · ← toggle) · FUND YOUR PRIVATE VAULT. (675 · below · ↑ Add-funds field) · NOW
CRASH THE MARKET. (787 · right · ↙ price simulator) · RESCUED. BACK TO GREEN. (1040 · right, by the
notes feed · ↑ rescue note). Two deliberate no-callout gaps kept — the dashboard-ring reveal and the
live rescue — let the screen carry. Footage layer stays perfectly steady (no shake/pulse). Both
Cermin-RWA product toasts kept as-is (diegetic notifications); all SFX + camera keyframes unchanged.
**S4b (YIELD)** likewise drops its bottom subtitle for ONE comic callout — SWEPT INTO YOUR LOAN.
parked below "Cermin's notes" and pointing straight ↑ at the fresh coupon note; it rides the S4b
camera push-in in content space.

### S4c · The MECHANISM — defense-vs-liquidation chart (barB(16)=2257 → barB(22)=2594, 6 bars ~11.2s)
The core of the pitch, stated in ONE code-drawn, comic-styled animated chart (`S4cMechanism.tsx` —
NOT a generated image; precision is the point). Comic identity: an ink-framed panel (raised fill,
thick parchment border), a low-opacity halftone dot overlay, a small hand-drawn sine **wobble** on
every line, and Bangers (`ComicText`) labels. Colors strictly: **gold** price line · **amber**
defense · **terracotta** liquidation · parchment text · ink bg. Beat-locked (S = barB(16), one beat
14.06f), wrapped in `<Pulse intensity=0.5 shake=0>` (readability first):
- **Bar 16** the panel + ink axes draw in; TWO horizontal dashed lines draw L→R — AMBER "MY DEFENSE
  LINE" (upper) and TERRACOTTA "LIQUIDATION" (much lower, big visible gap); the two comic tags pop.
- **Bars 17–18** a gold PRICE line animates in from the left, wanders down with jitter, and TOUCHES
  the defense line (bar 18) → localized flash + "AUTO-REPAY!" onomatopoeia at the contact + a burst
  of gold coin dots + the price BOUNCES up, and the DEFENSE LINE VISIBLY STEPS DOWN a notch with a
  gold "DEBT ↓" tick — repaying shrinks the loan, so the breach price drops (the killer detail).
- **Bars 19–20** price wanders down again → second TOUCH (bar 20), same beat; defense steps down
  again. The liquidation line has not moved and is now even further below the action.
- **Bar 21** the camera eases slightly wider; a gold bracket/arrow measures the untouched gap between
  the (final, lowest) defense line and liquidation — "NEVER. EVEN. CLOSE." — then a calm Manrope
  caption: "Repay a little, early, from a private vault — liquidation never gets a chance." Holds to
  the hard cut at barB(22). SFX: whoosh in, click at each touch, chime on each bounce, no riser.

### S5 · Privacy — WHERE the privacy lives (barB(22)=2594 → barB(27)=2876, 5 bars ~9.4s)
A **split-panel comparison** built from the existing comic assets, making the privacy explicit:
- **Bars 22–24** the screen is split by an ink divider. LEFT = `s3-vault` (you + your guardian
  filling the secret chest) tagged "WHAT YOU SEE" (goldSoft), with Manrope sublabels popping on
  beats: "Your vault" · "Your policy" · "Every rescue". RIGHT = `p1-blind` (the banker squinting at
  empty frames) tagged "WHAT THE POOL SEES" (parchment), sublabel "A loan. Paid on time. Nothing
  else."
- **Bars 25–26** the RIGHT panel takes over full-bleed (banker, darkened for legibility) and the
  pool's view resolves to the **0/0/0 zeros** (terracotta scramble → settle sage on barB(26), chime)
  labelled vaults · rescues · policies; sub-line "Verified on-ledger, live."; closing Bangers slam
  "PRIVACY ISN'T A SETTING. IT'S THE LEDGER." Holds into the S5→S6 slide.

### S5b · UNDER THE HOOD — money flow + per-party contracts (barC(23)=2876 → barC(33)=3439, 10 bars ~18.8s)
The explainer the pitch was missing: what actually moves, and WHY the privacy is structural. A
code-drawn, comic-styled scene (`S5bUnderHood.tsx` — same house style as S4c: ink-framed panels,
halftone overlay, hand-wobbled ink strokes, Bangers `ComicText` labels, brand palette). Wrapped in
`<Pulse intensity=0.5 shake=0>` (readability first). SFX: whoosh in, click per flow-arrow / card, no
riser. Two stages:
- **STAGE 1 · THE FLOW (bars 23–26):** title tag "UNDER THE HOOD." Four party nodes — YOU (borrower),
  LENDING POOL, SHADOW VAULT (dashed border = private, sits low = beneath the surface), GUARD AGENT
  (a drawn gold eye). One flow per bar draws an ink arrow (coin dots travel + a Bangers tag pops):
  bar 23 YOU→LOCK "COLLATERAL LOCKS." (the DROP-2 flash lands one bar in, at `barC(24)`); bar 24
  POOL→YOU "THE POOL LENDS." (cream coins); bar 25 YOU→SHADOW VAULT "YOU STOCK THE VAULT."; bar 26
  VAULT→LOCK (dashed gold) "RESCUES REPAY FROM HERE." + the guard eye pulses (watching).
  **Living flows:** while a flow is active, a CONTINUOUS looping stream of ~5 `CoinDot` bond-seal
  coins rides its path (gold, or cream on the pool-lends flow) — each pops in at the source, bobs
  along, and squashes into the destination; the receiving node gives a tiny absorb-pulse on each
  arrival, and the LOCK waits OPEN then CLICKS SHUT (shackle seats + body snap + 1-frame gold glint)
  as the first collateral coin lands. Coins stop at bar 27 (the arrows freeze into a dim legend).
- **STAGE 2 · WHO RECEIVES WHAT (bars 27–32):** the flow eases back to a dim legend on the left; a
  central **LEDGER** ink node appears above the cards, and four CONTRACT cards rise (one per bar
  27–30) — LOAN · SHADOW VAULT · GUARD POLICY · RESCUE EVENT — each with a row of eye-badges naming
  who RECEIVES it: LOAN → YOU · POOL · AGENT; the three private contracts → YOU · AGENT with the POOL
  eye-badge **struck through in terracotta** (and a dashed gold "private" border). As each card rises,
  tiny parchment "contract packets" fly FROM the ledger TO its party badges (badge absorb-pop on
  arrival). The three private cards' POOL-bound packet is **DEFLECTED**: it bounces off a terracotta
  **X** that stamps in with a thunk (existing click SFX, low volume — max 3 stamps) and dissolves
  into ink dots, never reaching the pool. Bars 31–32: headline "CONTRACTS SHIP ONLY TO THEIR
  PARTIES." + a calm Manrope subline "The pool's node never receives the private ones — that's
  Canton, not a permission flag." This is the exact STATE.md privacy matrix, drawn — and now the
  deflection makes "the pool's node never receives the data" unmistakable.

### S6 · Live on Canton DevNet (barC(33)=3439 → barC(38)=3720, 5 bars ~9.4s)
The "LIVE ON CANTON DEVNET" badge lands on the hard cut (SEAM 2, bar 33); one stat card pops per bar
(bars 34–37, click + count-up each); caption "Not a mockup. A live ledger." on bar 37. (S6 now
rides the track's real outro build via `<Pulse>`.)

Fast stat wall — **comic redesign (comicFx):** halftone ink page + a thick ink comic frame; the
LIVE badge is a rough-edged starburst **SEAL** (sage pulse-dot kept) with short `SpeedBurst`
speed-lines radiating on its pop; each stat is a comic CARD (ink outline + hard offset shadow +
a slight −2..2° tilt) slammed onto its bar in a loose comic-page layout (not a rigid grid); the
big "277" is Bangers with the ComicText ink treatment (`inkTextStyle`). Content + one-per-bar
timing UNCHANGED:
- Badge with sage pulse-dot: "LIVE on Canton DevNet"
- "277 tests green across 4 suites"
- "Real validator · OAuth2 · JSON Ledger API v2"
- "Multi-user: two borrowers rescued in one poll"
- "Self-service: connect → faucet → borrow → protected"
Caption: "Not a mockup. A live ledger."

### S7 · Close (barC(38)=3720 → 3941, ~7.4s) — rides the real outro
Hard cut on bar 38: Logo mark + "Cermin-RWA" large; tagline "Shadow money. Zero liquidations."
(gold); smaller line "Private DeFi on Canton Network." (no hackathon credit — product launch, not a
submission); mascot-watch calm in the corner. Holds through the wordmark reveal, then the visuals
fade clean to ink over the last ~60 frames as `Main.tsx`'s `partCVol` rides the track's REAL outro
to silence — landing together on ink+silence at frame **3941** (~2:11). Verified: outro decays to
≈ −86 LUFS with the last frame at luma 13/255.
**Designed (comicFx):** a soft radial gold `SpeedBurst` behind the wordmark, halftone texture, a
thin ink comic frame inset, 7 slow-drifting `DriftDots` motes, and a soft parchment-rim "sticker"
drop-shadow on the mascot so it sits IN the comic world — all subtle (the wordmark still owns the
frame) and all fade with the outro via the scene opacity. Bookends the S2 logo frame.

## Project layout

`video/` is a standalone npm package (do NOT touch other workspaces):
`package.json` (remotion@4, @remotion/cli, @remotion/transitions, @remotion/google-fonts, react 19),
`remotion.config.ts`, `src/Root.tsx` (registers `Main`), `src/Main.tsx` (TransitionSeries + the
three-part music assembly), `src/scenes/S1Problem.tsx` … `S5bUnderHood.tsx` … `S7Close.tsx`,
`src/lib/{beat.ts,tokens.ts,Camera.tsx,Cursor.tsx,ComicText.tsx,comicFx.tsx,fonts.ts,assets.ts}` —
**`beat.ts` is the single timing source**; `tokens.ts` derives `SCENE_START`/`SCENE_DUR` from it;
`ComicText.tsx` is the in-scene comic lettering system (Bangers); `comicFx.tsx` is the shared comic
FX helper set (Halftone · InkFrame · SpeedBurst · CoinDot · inkTextStyle · DriftDots). `scripts/placeholders.mjs`, `public/` (already
populated). TypeScript, no `any`.

## Acceptance

- `npm run placeholders && npx remotion render Main out/cermin-demo.mp4 --codec h264` completes;
  duration ≈ 131.4s (3941 frames).
- Every cut/animation lands on the beat grid; both seams (frames 2088 and 2876) have no silence
  gap/double-hit and the music+visuals fade to silence together at 3941 (riding the real outro).
  Every scene present (incl. the S4c mechanism chart, S5 privacy split-panel, and the S5b UNDER THE
  HOOD money-flow/per-party explainer), all copy English, exact numbers above.
- Look matches the FE tokens; no default-Remotion leftovers (no comp list clutter, no sample assets).
