# Fish Audio TTS Prompts — Ready to Copy-Paste

English voiceover, formatted with **Fish Audio S1 audio tags**
(inline `[tag]` — tag itself is silent, only shapes delivery).

Open **https://fish.audio/app/text-to-speech/**, then for each scene:

1. Pick a voice — recommended: **English male, authoritative but natural narrator**.
   (Search the voice library for "narrator", "documentary", or use your own cloned voice.)
2. Set **Model: S1** (latest, best audio-tag support)
3. Paste the scene block below → **Generate** → download MP3
4. Save each file into `public/audio/vo-XX-name.mp3` (e.g. `vo-01-hook.mp3`,
   `vo-02-problem.mp3`, etc.)

## Audio tag reference (Fish S1)

| Tag                  | Effect                                   |
| -------------------- | ---------------------------------------- |
| `[serious]`          | weightier tone, authoritative            |
| `[excited]`          | energetic, voice lifts                   |
| `[confident]`        | grounded, slower, declarative            |
| `[whispers]`         | low volume, intimate                     |
| `[sarcastic]`        | tilted delivery                          |
| `[curious]`          | rising intonation at end                 |
| `[pause]`            | short beat ~0.4s                         |
| `[long pause]`       | longer beat ~1s                          |
| `[sighs]`            | quick exhale                             |
| `[laughs]`           | short laugh                              |
| `[chuckles]`         | small laugh                              |
| `...` (ellipsis)     | natural micro-pause                      |
| `—` (em-dash)        | dramatic short pause                     |

**Tips:**

- Don't over-tag — max 2–3 tags per sentence.
- Spell out acronyms: `S D K`, `i N F T`, `R O I`, `T-two`.
- Spell out URLs: `zero arena dot vercel dot app` (not `zero-arena-fe.vercel.app`).
- Numbers as words: `one hundred thousand`, not `100,000`.
- Generate per scene, not one giant file — easier to re-take and timing aligns
  with frame ranges.

Total: **14 MP3 files**. Wiring into Remotion: see `SCRIPT.md` §5.

---

## Scene 01 · Hook · 0–8s (240 frames)

**Voice direction:** skeptical, slightly disdainful, ramps into the punch.

```
[serious] Every day on the timeline.

AI agents flexing hundreds of percent ROI. Ninety percent win rates. Twelve X in a single month.

[pause] None of it verifiable.
```

---

## Scene 02 · Problem · 8–19s (330 frames)

**Voice direction:** clinical, analytical. Beat between each problem.

```
[serious] Three classic problems.

[pause] Open-source your strategy — competitors fork it overnight.

Backtests are trivial to cherry-pick. A screenshot of two hundred percent. No dataset. No run log. Nothing to reproduce.

And live track record? [pause] Always private. Never public. Never append-only.
```

---

## Scene 03 · SolutionIntro · 19–29s (300 frames)

**Voice direction:** confident reveal. Brand name "Zero Arena" lands with weight.

```
[confident] This is Zero Arena.

The on-chain arena for AI trading agents.

[pause] Backtest qualifies you. Seasons prove you.
```

---

## Scene 04 · Architecture · 29–42s (390 frames)

**Voice direction:** explanatory, even pace. One breath per stage.

```
[serious] Five stages.

Write the agent on your own machine — strategy stays private.

The deterministic backtest produces a run hash, anchored on zero G Aristotle.

Mint it as an i N F T via E R C seven eight five seven.

The paper daemon runs your agent on real Binance candles — every epoch hash-chained on-chain.
```

---

## Scene 05 · Install · 42–52s (300 frames)

**Voice direction:** casual demo-style, slightly faster pace.

```
Start with one command.

n p x zeroarena init. Pick a strategy, answer a few prompts, your agent is ready.
```

---

## Scene 06 · Backtest · 52–66s (420 frames)

**Voice direction:** technical but accessible. Lean on the repetition.

```
The backtest runs.

[pause] Same dataset, same agent, same hash.

That's the T-two guarantee — the owner shares the encrypted agent and the A E S key, anyone reruns it, the hash must match.
```

---

## Scene 07 · CertifyMint · 66–84s (540 frames)

**Voice direction:** authoritative. Each transaction beat clear.

```
[serious] The result certifies into the Agent Certificate.

Then mints as an i N F T.

Every transaction shows up on Chainscan Aristotle — event logs, owners, all public.

[pause] This i N F T is your agent's permanent identity. Strategy stays private. The hash stays public forever.
```

---

## Scene 08 · Frontend · 84–104s (600 frames)

**Voice direction:** demo walkthrough, energetic but clear.

```
On the dashboard, every registered agent surfaces.

Sort by R O I, Sharpe, win rate.

Click any agent for full detail — certificate, dataset, owner — all read straight from chain.

[pause] No permission requested. No decryption needed. What you see, everyone sees.
```

---

## Scene 09 · Enroll · 104–119s (450 frames)

**Voice direction:** building anticipation. "Perp Mayhem" said with weight.

```
[serious] To compete, enroll into an active season. This one is Perp Mayhem — leverage up to ten X.

[excited] A one hundred thousand zero G prize pool waits for the winner.

One on-chain transaction, your agent joins the leaderboard.

The paper daemon executes every epoch — your infrastructure, or delegated to Zero Arena.
```

---

## Scene 10 · ArenaLive · 119–144s (750 frames)

**Voice direction:** rising energy. Climax on "+147% / -68%". This is the adrenaline scene.

```
[excited] The season runs. Perp B T C candles. Maximum leverage.

Every epoch, every commit, written to the Live Certificate.

[serious] The hash chain makes faking an epoch impossible.

[excited] The leaderboard re-orders live — some agents pumping to plus one hundred forty seven percent, some getting rekt to minus sixty eight. All of it visible.

[confident] No cheating. No cherry-picking. What's public stays public. Forever.
```

---

## Scene 11 · Settle · 144–159s (450 frames)

**Voice direction:** triumphant. Winner reveal lands hard.

```
[serious] When the season ends, settle runs automatically.

[excited] Perp Momentum Ten X finishes number one — plus one hundred forty seven percent.

The top three split one hundred thousand zero G — fifty, thirty, twenty thousand.

[confident] No admin can re-rank. The final transaction lands on Chainscan — for anyone who wants to verify.
```

---

## Scene 12 · Reputation · 159–172s (390 frames)

**Voice direction:** reflective, weighty. The "why it matters" beat.

```
[confident] Every win is a permanent on-chain credential.

This live cert records every epoch, from genesis to now.

[pause] Reputation that compounds — not a screenshot, but cryptographic proof.
```

---

## Scene 13 · Advantages · 172–180s (240 frames)

**Voice direction:** punchy, each bullet distinct. Like a checklist.

```
[confident] Four things that don't exist anywhere else.

[pause] Strategy private — end-to-end encrypted.

Backtests reproducible — same dataset, same hash.

Live record public — anchored forever on chain.

No S a a S lock-in — S D K and contracts, all open.
```

---

## Scene 14 · Closing · 180–186s (180 frames)

**Voice direction:** confident finality. Brand + CTA — clear, unhurried.

```
[confident] Zero Arena — dot vercel dot app.

n p m install zeroarena.

Build. Certify. Compete.
```

---

## Re-take cheatsheet

If a line comes out weird (mispronunciation, flat intonation, etc.):

- **Generate just that line** — no need to re-do the entire scene.
- Edit in Audacity: paste the new line replacing the old one (cut silence
  precisely at sample boundaries for clean splices).
- Or split the scene into multiple files, e.g. `vo-10a-arena.mp3` +
  `vo-10b-leaderboard.mp3`, then mount via `<Sequence>` in Remotion.

## Final mix checklist

- [ ] 14 MP3 files generated, all under `public/audio/`
- [ ] Each VO duration ≤ its scene duration (check with `afinfo file.mp3` on Mac)
- [ ] Music bed `music-bed.mp3` downloaded, volume 18–22% (see SCRIPT.md §4)
- [ ] Wired into `Main.tsx` via `<Audio>` + `<Sequence>` (see SCRIPT.md §5)
- [ ] Preview in Remotion Studio (`npm run dev`) — verify VO ↔ visual sync
