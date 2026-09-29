# Zero Arena Demo Video — Plan v2

Comprehensive plan for the 3-minute production demo video. Replaces the 85-second draft currently scaffolded in `src/scenes/`.

---

## 1. Best practices research (synthesis)

### Opening hook (0–10s)
- **State the high-stakes problem in plain language.** Not "decentralized verifiable backtest infrastructure". Try "Anyone can claim 80% winrate. There's no way to prove it."
- **Show, don't list.** Open on a screen full of fake-looking trading metrics → glitch/cross out → fade to the actual on-chain leaderboard. Visceral > narration.
- **No logo splash.** Logo earns a place at the end as the CTA, not the opener.

### Body (10–155s)
- **Show the product working, not slides about the product.** Rule of thumb: 70% of frames should be live UI / terminal / chain explorer. ≤30% can be diagram/text overlay.
- **Never let one screen sit > 5 seconds.** Even cursor moves count as motion. Long static screens = viewer drops.
- **One concept per scene.** "Backtest" is one. "Encrypt + upload + anchor" is another. Don't merge.
- **Prove it with a real chain link.** A short shot of the explorer tab showing the actual cert/INFT tx defeats every "is this just a mock" doubt.

### Closing (155–180s)
- **One CTA, one URL, one breath.** Not a list of 5 links. Pick the most important: live URL or `npm install`. Hold for 4–6 seconds.
- **End on the strongest visual, not a fade-to-black.** A loop of the live leaderboard ticking up while the URL sits beneath works better than empty space.

### General pacing
- 30 fps is enough; 60 fps adds cost without perceptual gain at this length.
- Voiceover is **optional** but captions are **required** — most demos are watched muted on autoplay.
- Cap runtime at 2:55 to allow a buffer second on top of the 3:00 commit.

### What we are deliberately NOT doing
- No animated gradient backgrounds.
- No "epic music drop at 0:30" — the work speaks; the music sits underneath.
- No "Founded in 2026" boomer-deck slide.
- No talking head.

---

## 2. Color palette (no gradients, single accent)

```
bg          #0a0a0f   pure-dark canvas
bgElev      #14141c   panel surface
bgPanel     #1c1c26   inner card
border      #2a2a38   1px hairline
borderSoft  #1f1f2a   subtle group separator

text        #fafafa   white-but-not-100% (kinder on OLED)
textMuted   #9a9aa8   secondary copy
textDim     #5e5e6e   timestamps / addresses

accent      #34d399   single emerald — used for "verified", "live", "win"
accentDim   #1f8c5e   accent in hover/dim states

posReturn   #34d399   wins (== accent intentionally — "winning is the only color")
negReturn   #f87171   losses (the only red on screen)
```

**Rules of use:**
- The accent appears on at most ONE element per frame.
- `posReturn` / `negReturn` only on numerical metrics. Never on UI chrome.
- All other UI uses neutrals only. Status badges that need color get a thin border + low-opacity fill in the accent; never a fill+ border in a third color.
- Fonts: Inter (sans) for UI, JetBrains Mono for code/terminal/hashes.

**Replaces existing `theme.ts`:** drop `cyan`, `violet`, `amber`, `glow`, `promptUser`, `promptHost`, `greenSoft`. Keep one solid emerald.

---

## 3. Visual style — terminal + glass

### macOS terminal mockup (used in install/CLI/E2E scenes)
- **Frame:** 12px rounded corners, 1px subtle inner border (`#2a2a38`), 1px outer with very low alpha
- **Title bar:** 28px tall, three traffic lights (close `#ff5f57`, min `#febc2e`, max `#28c840`), 12pt centered title in `textMuted`
- **Body:** `bgElev` solid, 28pt JetBrains Mono, line height 1.5
- **Glass effect:** when overlaid on FE screenshot, 16px backdrop-blur + `bgElev/0.85` overlay. NEVER on solid bg — looks like a mistake.
- **Cursor:** solid emerald block, 600ms blink (not the OS underscore — too thin to read at distance)
- **Drop shadow:** soft, `rgba(0,0,0,0.6)`, 24px blur, 12px Y offset. Single layer. No double-shadow stacking.

### FE iframe scenes
- The FE renders at https://zero-arena-fe.vercel.app with the same dark theme. Embed at 1×, no recoloring.
- Cursor that interacts is a custom 24×24 svg dot (white, 2px outer ring) — NOT the OS pointer.
- All click highlights are emerald 400ms pulse on the target element border.

### Diagram scenes (architecture, trust model)
- Pure geometric shapes, 2px stroke borders, no fills (or fills at 0.04 alpha).
- Arrows: 1.5px stroke, end with a 6×6 chevron, no Bezier curves > 30°.
- Labels: 16pt Inter Medium.

---

## 4. Storyboard — 3 minutes, 175 seconds total

| # | Scene | Sec | Visual | Voiceover / on-screen text |
| - | - | - | - | - |
| 1 | Hook | 0–8 | Fake "AI trading bot" landing page filling screen → 4 metrics flash up: "80% winrate" "12x ROI" "$10M AUM" → 0.4s glitch → all crossed out red → fade to black | "AI trading agents claim 80% winrate, 12x ROI. None of those claims are verifiable." |
| 2 | Problem framing | 8–15 | Two side-by-side wireframes: left "demand source code" (😬), right "trust the screenshot" (🙈). Both shown unacceptable. | "Demand the source — strategy IP gone. Trust a screenshot — fake. There's no third option." |
| 3 | Solution intro | 15–25 | Logo + tagline: **Zero Arena — the on-chain arena for AI trading agents.** Single line under: "Backtest qualifies you. Seasons prove you." Hold 3s. | "Zero Arena is the on-chain arena. Backtest qualifies you. Seasons prove you." |
| 4 | Architecture diagram | 25–38 | 5-phase lifecycle (qualify → mint → enroll → compete → settle) with chain glyphs. Animate left-to-right reveal, 2s per phase. | "Five steps, all on-chain. Strategy stays sealed. Trades stay public." |
| 5 | Install (terminal) | 38–48 | Terminal: `npx zeroarena init my-agent` → wizard flashes choices (RSI / MACD / EMA / LLM) → `cd my-agent` → `cat agent.ts` shows ~20 LOC of decide() | "One install. Pick a strategy template. Or paste your own decide function." |
| 6 | Backtest run | 48–62 | Terminal: `npm start` → progress bar → result panel: runHash, return +14.7%, sharpe 2.43, drawdown 6.1%, winRate 58% | "Deterministic backtest. Same agent, same dataset, same hash — every time, by anyone." |
| 7 | Certify + mint | 62–80 | Split screen: left terminal showing certify → mint logs with explorer URLs; right browser tab opens chainscan-galileo.0g.ai showing the live tx | "Encrypted run-log to 0G Storage. Cert + iNFT anchored on 0G Chain. Strategy never leaves your machine in plaintext." |
| 8 | Frontend leaderboard | 80–100 | FE iframe at /leaderboard. Cursor scrolls down podium → row of agents with TierBadge + OperatorBadge visible. Highlight one row, click → /agent/[slug] page. | "Every minted agent shows up here. T1+T2 trust badges. Operator-attested badge for delegated daemons." |
| 9 | Enroll in Season | 100–115 | Terminal: `npm run season:enroll-all 3` → 4 enroll txs scrolling. Switch to FE /season/3 — countdown ticking down "27m remaining" with 4 participants. | "Enroll your iNFT in an open Season. The arena window starts." |
| 10 | Live competition | 115–140 | Time-lapse FE /season/3 over the run window. Metrics update, leaderboard re-orders. Show 2-3 epoch commits flashing on the agent rows. End with "ENDED" status, podium reveal. | "Paper engine drives every agent on real Binance candles. Each epoch chain-committed. No one can fake the ranking." |
| 11 | Settle + prize | 140–155 | Terminal call to `Season.settle()` (auto-keeper) → tx confirmation → podium screen at /season/3 with #1 highlighted, prize transferred. Block explorer mini-window pops in showing the prize-out tx. | "Permissionless settle. Winner gets the prize. Loser gets a leaderboard entry no one can dispute." |
| 12 | Reputation / engagement | 155–168 | FE /agent/[slug] showing the winning agent's full history: cert hash, dataset hash, 12 epochs, season win badge, "Operator: Zero Arena" chip. Pan slowly. | "Every win is a permanent on-chain credential. Reputation that compounds." |
| 13 | Why us / advantages | 168–172 | 4-bullet flash, one bullet at a time, 0.5s each: <br>· **Strategy never leaves your machine** <br>· **Trades verifiable by anyone** <br>· **Live arena settles the question backtest can't** <br>· **One npm install, no SaaS lock-in** | (silent — text speaks) |
| 14 | CTA close | 172–178 | Single screen, dark, large emerald link: **`zero-arena-fe.vercel.app`** centered. Tiny line below: `npm install zeroarena`. Logo bottom-right, 50% opacity. | "See the live arena. Build your agent. The link is below." |

**Total: 178s = 2:58.**

---

## 5. Script — Indonesian voiceover (optional) + English captions

The captions are mandatory (autoplay + muted = default). Voiceover is optional but improves engagement; if added, record in Indonesian with English captions overlaid.

```
[0–8s]
EN: AI trading agents claim 80% winrate. No one can verify any of it.
ID: Agen trading AI klaim 80% winrate. Tidak ada yang bisa membuktikan.

[8–15s]
EN: Demand the source — your strategy IP is gone. Trust the screenshot — it's fake. There's no third option.
ID: Minta source — IP strategi lo hilang. Percaya screenshot — palsu. Belum ada opsi ketiga.

[15–25s]
EN: Zero Arena. The on-chain arena for AI trading agents. Backtest qualifies you. Seasons prove you.
ID: Zero Arena. Arena on-chain untuk agen trading AI. Backtest itu syarat masuk. Season itu pembuktiannya.

[25–38s]
EN: Five steps, all on-chain. Your strategy stays sealed. Your trades become public truth.
ID: Lima langkah, semuanya on-chain. Strategi tersegel. Trades jadi kebenaran publik.

[38–48s]
EN: One install. Pick a strategy template, or paste your own decide function.
ID: Sekali install. Pilih template strategi, atau paste decide function lo sendiri.

[48–62s]
EN: Deterministic backtest. Same agent, same dataset, same hash — for everyone.
ID: Backtest deterministik. Agen sama, data sama, hash sama — untuk siapa pun.

[62–80s]
EN: Run log encrypted to 0G Storage. Certificate and iNFT anchored on 0G Chain. Your strategy never leaves your machine in plaintext.
ID: Run log ter-enkripsi di 0G Storage. Certificate dan iNFT ter-anchor di 0G Chain. Strategi tidak pernah keluar dari mesin lo.

[80–100s]
EN: Every minted agent surfaces here. Trust tier badges. Operator-attested badges for delegated daemons.
ID: Setiap agent yang minted muncul di sini. Badge trust tier. Badge operator-attested untuk daemon yang delegasi.

[100–115s]
EN: Enroll your iNFT in an open Season. The arena window opens.
ID: Daftarin iNFT lo ke Season terbuka. Window arena mulai.

[115–140s]
EN: Paper engine drives every agent on real Binance candles. Every epoch chain-committed. No one can fake the ranking.
ID: Paper engine drive setiap agent di candle Binance asli. Setiap epoch ter-commit on-chain. Tidak ada yang bisa palsuin ranking.

[140–155s]
EN: Permissionless settle. Winner takes the prize. Losers get a leaderboard entry no one can dispute.
ID: Settle permissionless. Pemenang ambil prize. Yang kalah dapat entry leaderboard yang tidak terbantahkan.

[155–168s]
EN: Every win is a permanent on-chain credential. Reputation that compounds.
ID: Setiap menang adalah credential on-chain permanen. Reputasi yang terus bertumbuh.

[168–172s]
(silent — text bullets)

[172–178s]
EN: See the live arena. Build your agent. Link below.
ID: Lihat arena live. Bangun agent lo. Link di bawah.
```

---

## 6. Per-scene execution plan

Existing scaffold in `src/scenes/` covers most of this. Mapping to the storyboard:

| Storyboard scene | Existing file | Action |
| - | - | - |
| 1. Hook | `HookScene.tsx` | **Rewrite** with fake-claims/glitch sequence per storyboard |
| 2. Problem framing | _(new)_ | Add `ProblemScene.tsx` |
| 3. Solution intro | _(new)_ | Add `SolutionIntroScene.tsx` |
| 4. Architecture | `ArchitectureScene.tsx` | Update to 5-phase lifecycle (qualify → mint → enroll → compete → settle) |
| 5. Install | `InstallScene.tsx` | Adopt new terminal style; show wizard branches |
| 6. Backtest | `BacktestScene.tsx` | Update with real metrics from a known-good run |
| 7. Certify + mint | merge `CertifyScene` + `MintScene` | Combined split-screen with terminal + chainscan window |
| 8. Frontend leaderboard | `FrontendScene.tsx` | Embed real FE screenshots / iframe; show OperatorBadge prominently |
| 9. Enroll in Season | `SeasonScene.tsx` (rewrite) | Terminal enroll-all + FE countdown |
| 10. Live competition | _(new)_ | Add `ArenaLiveScene.tsx` with leaderboard time-lapse |
| 11. Settle + prize | _(new)_ | Add `SettleScene.tsx` |
| 12. Reputation | _(new)_ | Add `ReputationScene.tsx` |
| 13. Why us bullets | _(new)_ | Add `AdvantagesScene.tsx` |
| 14. CTA close | `ClosingScene.tsx` | Replace with single emerald URL screen |
| _(remove)_ | `StrategyPickerScene.tsx`, `CodeScene.tsx`, `TransferScene.tsx` | Either fold into install scene or drop entirely — they pad runtime |

`timing.ts` total needs to grow from 85f to ~5340f at 30 fps (= 178s).

---

## 7. Asset capture checklist

Things to record / mock / pull before scene implementation:

| Asset | Source | Notes |
| - | - | - |
| FE leaderboard screen | https://zero-arena-fe.vercel.app/leaderboard | After Season #2 + #3 settle, capture at 1920×1080 |
| FE agent detail | /agent/cert-9 (perp ema-crossover) | Show OperatorBadge clearly |
| FE Season detail | /season/3 (perp arena) | Capture both ACTIVE and SETTLED states |
| FE Season list | /seasons | Show #2 SETTLED card + #3 SETTLED card side by side |
| Chainscan tx pages | https://chainscan-galileo.0g.ai/tx/<hash> | One mint, one cert, one EpochCommitted, one Season.settle |
| Terminal recording: install | local `npx zeroarena init` | One clean run, save as cast file or replay frame-by-frame |
| Terminal recording: backtest | local `npm start` | Single 8-second run with deterministic output |
| Terminal recording: enroll-all | `npm run season:enroll-all 3` | Already happened in production — can replay log |
| Logo (high-res PNG) | `public/logo.png` | Use only at the end |

---

## 8. Implementation order (after plan approved)

1. **Update `theme.ts`** to the 6-color palette + drop `glow`. (10 min)
2. **Update `timing.ts`** to the new 14-scene structure totaling 178s. (10 min)
3. **Build the macOS terminal component** (`components/MacTerminal.tsx`) reusable across scenes 5/6/7/9. (45 min)
4. **Wire each scene** in storyboard order. Hook + Closing first (highest visual stakes). (4–6 hours)
5. **Add captions overlay** as a top-level component reading from a single `captions.ts`. (1 hour)
6. **Capture FE assets** during Season #3 ACTIVE → SETTLED transition. (30 min)
7. **Render preview** at 30fps; iterate scene-by-scene. (1–2 hours iteration)
8. **Render production** at 1920×1080 H.264 high bitrate; final length cap 178s. (30 min build)
9. **Optional: voiceover record + sync.** (1 hour)

Total estimate: **~10 hours of focused work** for a polished cut.

---

## 9. Why this matters — talking points

For the closing pitch and any pre-roll text, the differentiation worth hammering:

1. **Strategy never leaves your machine in plaintext.** Backtest runs locally. Encrypted run log uploaded. Hash anchored on chain. No AI vendor sees it. No matchmaker sees it. We don't see it.
2. **Trades are verifiable by anyone.** The on-chain `runHash` is a deterministic fingerprint. Anyone with the dataset + the encrypted bundle + the AES key can rerun and assert the same hash. T2 reproducibility.
3. **Live Seasons settle what backtest can't.** Backtest answers "did it work on past data?" Season answers "does it work on candles no one has seen yet?" Hash-chained epoch commits make cherry-picking detectable. v0.4 puts the engine inside a 0G Compute TEE; trustless.
4. **One npm install, no SaaS lock-in.** `npm install zeroarena` and you're done. Your wallet pays gas. Your iNFT is yours. We are infrastructure, not a service.
5. **The arena's leaderboard is the asset.** Permanent. On-chain. Composable into any other protocol. Reputation that survives our shutdown if it ever happens.

---

## 10. Locked decisions (2026-05-16)

1. **Voiceover: yes**, Indonesian recording (matches the team's natural language).
2. **Captions: English only**, baked into the render.
3. **Music: ambient electronic, royalty-free.** I'll stub a track from Pixabay/Mixkit; final track can be swapped in later without rebuilding scenes.
4. **Real production IDs everywhere.** Wallet A `0xB1a5402E…3f50DbD`, real token IDs 1–11, real Season IDs 2/3, real chain explorer URLs. No mocks anywhere.
5. **Required FE pages in demo (mandatory screen time):**
   - Dashboard `/` (registry)
   - Leaderboard `/leaderboard`
   - **One season detail** — pick `/season/2` (spot, settled, 5 participants — best ranking story)
   - **One agent detail** — pick `/agent/cert-1` (RSI Classic, token #1, most recognizable)
6. **End screen:** dashboard URL big, `npm install zeroarena` small underneath.
7. **Pinned terminal-install design** required (scene 5) — must use the macOS-glass spec from §3.
