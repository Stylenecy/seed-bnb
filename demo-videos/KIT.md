# demo-videos kit

One Remotion 4.0.489 workspace for all seed-bnb-indo BNB demo videos. There is one composition per project, and its id is the project slug. `src/projects/iusd-pay` is the reference implementation (the pilot), so copy its structure.

```
npm run dev                                   # Remotion Studio
npx tsc --noEmit                              # must be clean
node scripts/stills.mjs <slug> out/stills 0 bar:4 bar:12.3   # batch stills (one bundle)
python3 scripts/contact.py sheet.png out/stills/*.png          # contact sheet to eyeball
npx remotion render <slug> out/<slug>.mp4 --concurrency=6
```
`bar:K.B` in `stills.mjs` means beat B of bar K, using Bring It On by default. For other tracks, set `BPM=… OFFSET=…`. `NUDGE=6` renders 6 frames after the beat, which is useful for seeing a pop after it lands.

## Add a project
1. Create `src/projects/<slug>/`, containing:
   - `theme.ts`: brand tokens lifted from the project's frontend CSS, the `SCREEN` paths, and the chain facts (`CHAIN`), copied verbatim from `deployments/*.json` and `VERIFY-BNB.md`.
   - `timeline.ts`: `export const G = makeBeat(beatConfig(TRACKS.<id>))`, a `BAR` map of scene start bars, and `TOTAL`.
   - `scenes/S*.tsx`, and `Main.tsx` (exports `Main` and `TOTAL`, wraps everything in `<BeatProvider grid={G}>`).
2. Register the project in `src/Root.tsx` by adding it to `PROJECTS`.
3. Put the project's screenshots in `public/<slug>/`. `scripts/iusd-pay/capture.mjs` is a template for driving a real app in puppeteer with a throwaway injected wallet.
4. Render to `out/<slug>.mp4`, then copy it to `seed-bnb-indo/<project>/demo/<slug>-bnb-demo.mp4`.

## Music (`src/kit/tracks.ts`, files in `public/music/`)
| id | BPM | first beat | length | shape |
|---|---|---|---|---|
| `bringItOn` | 128.01 | 0.209 s | 78.7 s | 3 bars up + 1 break bar. Drops on 4, 8 … 36, breaks on 3, 7 … 35, silent from bar 40 |
| `hitslab` | 82.65 | 0.464 s | 65.8 s | steady, lifts from bar 11 |
| `cermin` | 125 | 0 s | 142 s | intro bars 0–7, plateau 8–63, outro 64–71. Use `musicStartS` to start mid-file |

Vary the track between videos. `python3 scripts/energy.py <mp3> <bpm> <offset>` regenerates an energy map.

## Beat API (`beat.ts`, `BeatContext.tsx`, `SceneTimeline.tsx`)
- `makeBeat({bpm, offsetS, fps, musicStartS?, energy?})` returns a grid with these helpers:
  - `bar(k)` and `beat(k)` give the composition frame, and `at(k, b)` gives beat b of bar k.
  - `beats(n)` gives a length in frames, and `beatsIn(a, b)` lists the beat frames between bars a and b.
  - `energyAt(f)`, `beatPhase(f)` and `isDownbeatAt(f)` read the track at frame f.
- `<SceneTimeline scenes=[{id, from, to, enter, component}]>` supports these `enter` modes:
  - `"cut"`: a hard cut on the downbeat. Use it on drops.
  - `"slide"` / `"whip"`: starts half a beat early so the move lands on `from`. The outgoing scene is pushed out.
  - `"zoom"`: punches in from 1.25×.
- Inside a scene, call `const { b, beatsIn } = useSceneClock()`. `b(k, beat)` gives the **local** frame of a track bar. Use it for every pop, SFX, camera key and counter tick. Never hand-pick frame numbers.
- `<Pulse intensity shake glow>` wraps the main content. It adds a scale pump on every beat, a lift on downbeats, and a shake when energy is above 0.85. For UI screenshots, use `shake={0}` and `glow={false}`.
- `useBeatPunch(hits, amt)` gives one element a per-beat scale bump.
- `punch()` is the pure version of the same bump.
- `<Flashes hits>` is mounted at the top level of `Main` and gives 1-frame flashes on drops.

## Audio (`Audio.tsx`)
- `<Music track total volume={0.5} fadeOut>` plays the music about 6 dB under the SFX.
- `<Sfx name at volume>` plays `whoosh`, `impact`, `tick` or `chime`, which are normalised copies of the perps-agent SFX. It lands **on** `at`, because the whoosh is started 8 frames early.
- Put scene-internal SFX inside the scene. Put transition whooshes in `Main` via `<SfxTrack>`, because a scene's Sequence would cut them off.

## Voice-over cut (`Voice.tsx`, `scripts/_vo/`)
The VO version is a **second** composition, `<slug>-vo`: the same `Main` rendered with `{ vo: true }`. The plain `<slug>` comp is the no-VO cut and must render exactly as before, so `vo` defaults to `false` and nothing VO-related is mounted without it. `src/projects/iusd-pay` is the reference.

1. **Script**: write `scripts/<slug>/vo.lines`, one line per clip: `id | rate | pitch | text` (`#` comments are allowed, and an optional `voice = en-GB-RyanNeural` line). Use snake_case ids, rates like `+10%` and pitches like `-1Hz`. Only make claims that `VERIFY-BNB.md` or the screen backs up. Say numbers the way they are spoken ("nine point nine five").
2. **Generate**: `<venv-tts>/bin/python scripts/_vo/gen.py <slug> [id …]`. This runs edge-tts, trims silence (inner pauses are capped at 0.32 s), normalises to −12 LUFS and writes `public/<slug>/vo/<id>.m4a`. It also rewrites `src/projects/<slug>/vo.gen.ts` (`VO_LINES` with the ffprobe durations, plus `VoId`). Passing ids regenerates only those lines.
3. **Place** the lines in `Main.tsx`:
   ```tsx
   import { duckFor, placeVo, VoTrack } from "../../kit";
   import type { VoCue, VoProps } from "../../kit";
   import { VO_LINES } from "./vo.gen";
   import type { VoId } from "./vo.gen";
   const VO_AT: VoCue<VoId>[] = [["hook", 0, 1], ["gas", 1, 2, 2] /* id, bar, beat, +frames */];
   const VO = placeVo(G, VO_LINES, VO_AT);   // throws if two lines overlap
   const duck = duckFor(VO);                   // music x0.35 under lines, 6f attack / 8f release
   export const Main: React.FC<VoProps> = ({ vo = false }) => ( …
     <Music track={TRACK} total={TOTAL} volume={0.5} duck={vo ? duck : undefined} />
     {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
   ```
   Every line starts on a beat (`placeVo` adds 2 frames so the consonant lands just after it), next to the step it talks about. Each line ends before the next line and before the next big hit. Leave the comic slams and drops to the music alone. SFX are not ducked. If a project runs its own music bed (like cermin's splice), multiply its `volume` callback by `duck(compFrame)`.
4. **Register** the cut: add the slug on its own line in `VO_CUTS` in `src/Root.tsx`. `PROJECTS` stays as it is.
5. **Render and check**:
   ```
   npx remotion render <slug>-vo out/<slug>-vo.mp4 --concurrency=4
   python3 scripts/_vo/check.py out/<slug>-vo.mp4 out/<slug>.mp4 --limit
   ```
   `check.py` prints the integrated loudness (the target is −13 to −11 LUFS; nudge `VoTrack volume` to get there), the true peak (≤ −0.5 dBFS) and any silences longer than 1 s, and it compares the duration with the no-VO cut. With `--limit`, if the true peak is over, it re-encodes only the audio through a limiter and copies the video untouched. Then copy the result to `seed-bnb-indo/<project>/demo/<slug>-bnb-demo-vo.mp4`. Never overwrite `out/<slug>.mp4`.

## Components
| file | exports |
|---|---|
| `comicFx.tsx` | `Halftone`, `InkFrame`, `SpeedBurst`, `Starburst`, `CoinDot`, `inkTextStyle`, `DriftDots`, `ComicPanel` (slam-in panel with a halftone gradient and an ink offset shadow), `Caption`, `SpeechBubble`, `InkArrow` (draws on) |
| `ComicText.tsx` | `ComicText`: Bangers lettering with a squash-stretch pop on a beat. The `variant="onomatopoeia"` version adds an echo ghost and a buzz, and supports `burst` and `stagger` |
| `comicArt.tsx` | code-drawn actors: `Person` (mood and pose), `Phone`, `Vault`, `Robot`, `LockedEnvelope`, `GasPump`, `Wallet`, `Jar`, `SweatDrops`. These are SVG `<g>` elements, positioned with x, y, s and rot |
| `Camera.tsx` / `Cursor.tsx` | a keyframed zoom and pan over a content plane, and a counter-scaled pointer with `click` ripples |
| `Glass.tsx` / `PremiumBg.tsx` | the perps-agent liquid glass look: `Glass`, `Glint`, and a dark canvas with glows, a grid floor, beams and guides |
| `DeviceFrames.tsx` | `PhoneFrame` (for 860×1864 mobile captures) and `BrowserFrame` |
| `BnbBadge.tsx` | `BnbMark`, a code-drawn BNB diamond in #F0B90B, and `BnbBadge`, a pill in dark, gold or comic style, with an optional live dot |
| `BscScanProof.tsx` | an explorer-style card whose rows land on beats with a hex-scramble resolve. Only **real** addresses and txs go in it |
| `anim.ts` | `ramp`, `fadeUp`, `popIn`, `steppedCount` (counters that tick on beats), `countUp`, `scrambleHex` |

## Rules of thumb (the bar set by iusd-pay)
- The structure is Hook comic → logo drop → how-it-works comic → real app → on-chain proof → stat wall → outro. Put hard cuts on drops, soft slides on breaks, and title cards or "UGH." moments on break bars.
- Within a bar, the panel slams in on b0 and the inner details pop on b1, b2 and b3. Every panel has something happening on every beat.
- Every number on screen must come from `VERIFY-BNB.md`. Label the real-UI screens as real, and label results as the on-chain result.
- Use Bangers only for lettering. Headlines use the display serif, and UI and body text use the sans.
