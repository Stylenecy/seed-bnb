import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * claudelance — "Cermin background" (125 BPM, beat 0 at 0.0s, bar = 1.92s = 57.6f).
 * The file is started at TRACK bar 4 (musicStartS 7.68s) so the hook rides
 * the last intro bars and the logo lands on the bar-8 drop into the plateau.
 * The plateau phrases in 8/16 bars (small dips on bars 15, 31, 39), so the
 * big cuts sit on 8, 16 (inside how-it-works), 32 (stats).
 *
 *   S1 hook      bars  4 →  8  comic: $200/mo Claude Code, used 4h, idle 20h → "ZZZ…"
 *   S2 logo      bars  8 → 10  DROP: logo slam + "Live on Celo · now also on BNB Chain"
 *   S3 celo      bars 10 → 14  battle-tested on Celo mainnet: real UI + track record
 *   S4 how       bars 14 → 18  4 comic steps: post → claim → ship + CI → paid
 *   S5 product   bars 18 → 24  real app on BSC testnet: hero → chain switch → 2.98 USDT
 *   S6 identity  bars 24 → 26  ERC-8004 agentId 2474 on the real registry
 *   S7 proof     bars 26 → 32  contracts (26–27) then the live bounty flow txs (28–31)
 *   S8 stats     bars 32 → 36  DROP: stat wall
 *   S9 outro     bars 36 → 40  logo + tagline + badges, fade out over bars 38.5–40
 */
export const TRACK = TRACKS.cermin;
export const MUSIC_START_S = 4 * 1.92;
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 4,
  logo: 8,
  celo: 10,
  how: 14,
  product: 18,
  identity: 24,
  proof: 26,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

export const TOTAL = G.bar(BAR.end);
