# BINGOChain — Demo Video (Remotion)

A 1080p walkthrough that replicates the `apps/web` frontend 1:1 (cinematic
landing scroll → Arenas lobby → Create arena → join + play a full Bingo match to
a win → Cup → Profile), followed by a motion-graphic **explainer outro**
(problem → solution → why on-chain → CTA) with epic transitions. ~101s.

Fidelity comes from reusing the app's actual design system: `tailwind.config.ts`
and the `:root` token block in `src/style.css` are copied verbatim from
`apps/web`, the five fonts (Anton, Condiment, Hanken Grotesk, Geist Mono,
Bricolage Grotesque) are the same families, and every component is the real
markup with Next/wagmi/motion swapped for static props + frame-driven motion.
The landing backgrounds are the production CloudFront videos (bundled, trimmed).

## Render

```bash
pnpm install
pnpm render          # → out/bingochain-demo.mp4  (1920×1080, 30fps, ~69s)
pnpm dev             # Remotion Studio to scrub/preview
```

## Layout

```
src/
  Demo.tsx            master TransitionSeries (scene order + fades + font vars)
  Root.tsx            <Composition> registration (1920×1080 @30)
  style.css           design tokens copied from apps/web/app/globals.css
  fonts.ts            @remotion/google-fonts loaders → CSS vars
  scenes/             one file per screen of the flow
    Landing.tsx       Hero / About / Collection / Cta, auto-scrolled
    Arenas.tsx        /arenas lobby
    Create.tsx        /create
    Game.tsx          /arena/43 — build → join → play → BINGO → win
    Cup.tsx           /competition
    Profile.tsx       /profile
    Explainer.tsx     outro: Problem / Solution / WhyOnchain / Cta (motion graphics)
  components/         presentational copies of the app components
  lib/                cn, board math, identicon, achievements, mock data
public/videos/        the six landing clips (real production footage)
```

## Narration + ambient (macOS `say`)

Voice-over is a British narrator (`say -v Daniel`) over a looped background
music bed at 30%. Both are baked into the composition as `<Audio>` in
`Demo.tsx`, so `pnpm render` reproduces the final with sound.

- `public/audio/narration.wav` — the 12 lines placed at each scene's start time.
- `public/audio/energysound-powerful-percussion-513717.mp3` — background music,
  looped to cover the comp and mixed at `volume={0.3}` so narration stays clear.

To regenerate (e.g. new lines, different voice, or after installing a Premium
voice in System Settings → Spoken Content): edit the lines + offsets in
`scripts/build-audio.sh` and run it, then re-render. Swap `Daniel` for any
installed voice (`say -v '?'`).

## Tuning

Scene lengths live in `SCENE` in `src/Demo.tsx`. The Bingo call sequence and all
demo data live in `src/lib/mock.ts` — `MY_BOARD` + `CALL_SEQUENCE` are arranged
so the meter lights B→I→N→G→O and hits BINGO on the final call (verified math).
Cursor paths are per-scene `interpolate()` calls; render a still
(`npx remotion still BingoChainDemo out/x.png --frame=N`) to re-aim them.
