/**
 * beat.ts — the SINGLE timing source for the whole video.
 *
 * The score is "Bring It On (Airstream)" — 128 BPM, first beat at 0.238s into
 * the file. The track (78.75s) is shorter than the cut, so it is assembled in
 * THREE parts joined by hard seams on shared bar boundaries (so the beat phase
 * stays continuous across each seam):
 *   • Part A: music 0 → 69.60s over comp frames 0 → SEAM_FRAME (bar 37).
 *   • Part B: at seam 1, jump to music-time 24.61s (bar 13, mid-build) and ride
 *     the peak. Part B now ENDS at SEAM2_FRAME (comp 2876 = music-time 50.88s).
 *   • Part C: at seam 2, jump BACK to music-time 43.363s (bar 23, the pre-DROP-2
 *     break — so the tech/close act opens on a breath and DROP 2 hits one bar
 *     in) and ride the track's REAL outro through to 78.75s. The cut fades to
 *     ink exactly as the outro fades to silence (~2:11).
 *
 * EVERY scene boundary, transition length, text beat, node activation, footage
 * cut, stat pop and toast entrance is derived from `barA` / `barB` / `barC` /
 * `beatA` below — no hand-picked frame numbers off the grid.
 */

export const FPS = 30;
export const BPM = 128;
export const BEAT_S = 60 / BPM; // 0.46875 s  (= 14.0625 frames)
export const BAR_S = 4 * BEAT_S; // 1.875 s   (= 56.25 frames)
export const OFFSET_S = 0.238; // first beat in the file
export const SEAM_FRAME = 2088; // part B starts here (comp frame; = bar 37 of part A)
export const B_MUSIC_START_S = 24.61; // music-time at seam 1 (bar 13)
export const SEAM2_FRAME = 2876; // part C starts here (comp frame; = barB(27) = barC(23))
export const C_MUSIC_START_S = 43.363; // music-time at seam 2 (bar 23, pre-DROP-2 break)
export const TRACK_LEN_S = 78.75; // the score's real length

/** Comp frame of bar `k` in part A (bars 0..37). */
export const barA = (k: number): number => Math.round((OFFSET_S + k * BAR_S) * FPS);

/** Comp frame of bar `k` in part B (k >= 13). */
export const barB = (k: number): number =>
  SEAM_FRAME + Math.round((OFFSET_S + k * BAR_S - B_MUSIC_START_S) * FPS);

/** Comp frame of bar `k` in part C (k >= 23). barC(23) === SEAM2_FRAME === barB(27). */
export const barC = (k: number): number =>
  SEAM2_FRAME + Math.round((OFFSET_S + k * BAR_S - C_MUSIC_START_S) * FPS);

/** Comp frame of beat `k` in part A. */
export const beatA = (k: number): number => Math.round((OFFSET_S + k * BEAT_S) * FPS);

/** Comp frame of beat `k` in part B (k such that beat sits after seam 1). */
export const beatB = (k: number): number =>
  SEAM_FRAME + Math.round((OFFSET_S + k * BEAT_S - B_MUSIC_START_S) * FPS);

/** Comp frame of beat `k` in part C (k >= 92, i.e. from bar 23). */
export const beatC = (k: number): number =>
  SEAM2_FRAME + Math.round((OFFSET_S + k * BEAT_S - C_MUSIC_START_S) * FPS);

/** Total composition length — the launch cut now rides the track's REAL outro
 *  (music fades to silence ~71.4→78.75s), landing on ink+silence together:
 *  the comp frame where music-time reaches the track end, plus a 3-frame safety
 *  tail so partCVol's fade lands cleanly on zero. */
export const TOTAL_FRAMES =
  SEAM2_FRAME + Math.round((TRACK_LEN_S - C_MUSIC_START_S) * FPS) + 3; // 3941 ≈ 131.4s (2:11)

/** One beat, snapped to a frame. */
export const TRANSITION_FRAMES = Math.round(BEAT_S * FPS); // 14

/** Short crossfade/slide length (half a beat) — used only at the two soft gaps;
 *  the impact gaps (act breaks + the seam) are hard cuts landing on the downbeat. */
export const XFADE_FRAMES = Math.round((BEAT_S * FPS) / 2); // 7

/** Half a bar (two beats), for mid-bar accents. */
export const HALF_BAR = Math.round(2 * BEAT_S * FPS); // 28

/** Music-time (seconds) playing at a given comp frame, accounting for BOTH
 *  seams (piecewise over parts A / B / C). */
export const musicTimeAt = (f: number): number =>
  f < SEAM_FRAME
    ? f / FPS
    : f < SEAM2_FRAME
      ? B_MUSIC_START_S + (f - SEAM_FRAME) / FPS
      : C_MUSIC_START_S + (f - SEAM2_FRAME) / FPS;

/* ==================================================================== *
 *  BEAT-INTENSITY SYSTEM — energy map, per-beat phase, section flashes  *
 *  so the whole video can BREATHE with the track (see Pulse.tsx).       *
 * ==================================================================== */

export type EnergyPoint = { t: number; e: number };

/**
 * Normalized RMS energy of the score, keyed by MUSIC-TIME seconds. Measured
 * from the master. Interpolate between points for a continuous 0..1 envelope.
 * Landmarks: intro 0.75 → 6–8 dip → 8–13 high 0.9 → 14 breakdown 0.16 → build
 * to PEAK 0.96 @26.5 → 36 break 0.43 → 44 break 0.23 → DROP 2 0.9 @46 →
 * MAX 1.0 @54–65 → outro fade to 0 @78.75.
 */
export const SECTION_ENERGY: EnergyPoint[] = [
  { t: 0, e: 0.75 },
  { t: 6, e: 0.75 },
  { t: 7, e: 0.38 },
  { t: 8, e: 0.9 },
  { t: 13, e: 0.9 },
  { t: 14, e: 0.16 },
  { t: 16, e: 0.71 },
  { t: 26.5, e: 0.96 },
  { t: 36, e: 0.43 },
  { t: 38, e: 0.7 },
  { t: 43, e: 0.7 },
  { t: 44, e: 0.23 },
  { t: 46, e: 0.9 },
  { t: 51, e: 0.9 },
  { t: 52, e: 0.58 },
  { t: 54, e: 0.9 },
  { t: 60, e: 1.0 },
  { t: 65, e: 0.95 },
  { t: 66, e: 0.8 },
  { t: 71, e: 0.8 },
  { t: 78.75, e: 0 },
];

/** Interpolated track energy (0..1) at a given comp frame. */
export const energyAt = (f: number): number => {
  const t = musicTimeAt(f);
  const pts = SECTION_ENERGY;
  const first = pts[0]!;
  if (t <= first.t) return first.e;
  for (let i = 1; i < pts.length; i++) {
    const b = pts[i]!;
    if (t <= b.t) {
      const a = pts[i - 1]!;
      const span = b.t - a.t;
      const frac = span <= 0 ? 0 : (t - a.t) / span;
      return a.e + (b.e - a.e) * frac;
    }
  }
  return pts[pts.length - 1]!.e;
};

/** Fractional beat index at a comp frame (music-time based, seam-continuous). */
export const beatIndexFloatAt = (f: number): number =>
  (musicTimeAt(f) - OFFSET_S) / BEAT_S;

/** Phase 0..1 within the current beat at a comp frame (0 = right on the beat). */
export const beatPhase = (f: number): number => {
  const bf = beatIndexFloatAt(f);
  return bf - Math.floor(bf);
};

/** Integer beat index (which beat of the track) at a comp frame. */
export const beatIndexAt = (f: number): number => Math.floor(beatIndexFloatAt(f));

/** True when a comp frame sits on a downbeat (first beat of a 4-beat bar). */
export const isDownbeatAt = (f: number): boolean =>
  (((beatIndexAt(f) % 4) + 4) % 4) === 0;

/**
 * Inverse of `musicTimeAt`: all comp frames at which a given MUSIC-TIME plays.
 * The three parts overlap in music-time, so a single music-time can appear more
 * than once — hence an array. Part A plays music 0→69.6 (comp 0→SEAM_FRAME),
 * Part B plays music 24.61→50.88 (comp SEAM_FRAME→SEAM2_FRAME), Part C plays
 * music 43.363→78.75 (comp SEAM2_FRAME→TOTAL_FRAMES).
 */
export const compFramesAt = (t: number): number[] => {
  const out: number[] = [];
  if (t >= 0 && t <= SEAM_FRAME / FPS) out.push(Math.round(t * FPS));
  if (t >= B_MUSIC_START_S) {
    const fB = SEAM_FRAME + Math.round((t - B_MUSIC_START_S) * FPS);
    if (fB <= SEAM2_FRAME) out.push(fB); // part B now ends at seam 2
  }
  if (t >= C_MUSIC_START_S) {
    const fC = SEAM2_FRAME + Math.round((t - C_MUSIC_START_S) * FPS);
    if (fC <= TOTAL_FRAMES) out.push(fC);
  }
  return out;
};
