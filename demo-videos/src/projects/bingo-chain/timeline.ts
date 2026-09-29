import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * bingo-chain — "Bring It On" (128.01 BPM, first beat 0.209s, bar = 1.875s = 56.24f).
 * Unlike iusd-pay (which rides the whole song from bar 0), the file is started
 * AT the bar-8 drop (musicStartS = 15.21s), so frame 0 is already a downbeat
 * with the band in and the video rides the back half of the song: 3 up + 1
 * break per phrase, peak at 32–34, outro tail 38–39, silent from bar 40.
 * All bar numbers below are TRACK bars.
 *
 *   S1 hook      bars  8 → 12  comic: "trust the house" bingo; bar 11 break = "RIGGED?!"
 *   S2 logo      bars 12 → 15  DROP: logo slam, B-I-N-G-O balls pop per beat, Celo + BNB badges
 *   S3 celo      bars 15 → 19  slide on the break; real Celo app + live mainnet reads
 *   S4 how       bars 19 → 24  whip on the break; seal → call → BINGO! → reveal & verify
 *   S5 product   bars 24 → 28  DROP: real BSC-testnet web (lobby → create → arena #1) + "BINGO!"
 *   S6 proof     bars 28 → 32  contracts (28) then the 13-tx live game (29–30), "SETTLED!" (31)
 *   S7 stats     bars 32 → 36  DROP (peak): stat wall
 *   S8 outro     bars 36 → 40  logo + tagline + badges, fade over the tail
 */
export const TRACK = TRACKS.bringItOn;
export const START_BAR = 8;
export const MUSIC_START_S = TRACK.offsetS + START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 8,
  logo: 12,
  celo: 15,
  how: 19,
  product: 24,
  proof: 28,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** One beat past bar 40 (music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
