// 14-scene timeline. Total 234s = 7020f @ 30fps.
// Durations driven by the actual VO MP3 durations in public/audio/
// (ceil(audio) + ~1s breathing buffer).
//
// Audio source: fish.audio S1 English narration. See AUDIO_PROMPTS.md.

export const FPS = 30;

// Each value is the scene's runtime in seconds. Scene = ceil(VO_sec + ~1s).
const SCENE_SECONDS = {
  hook: 13,            // VO 10.08s · tweet collage + UNVERIFIED stamp (audio delayed 2s after scene start)
  problem: 20,         // VO 18.65s · three failure modes
  solutionIntro: 10,   // VO  8.70s · Zero Arena wordmark + 2 pillars
  arch: 20,            // VO 19.33s · 5-stage lifecycle (3+2 rows)
  install: 9,          // VO  7.86s · terminal npx zeroarena init
  backtest: 15,        // VO 13.53s · terminal backtest run + runHash
  certifyMint: 19,     // VO 17.66s · split terminal + chainscan tx
  frontend: 19,        // VO 17.95s · FE leaderboard + agent detail
  enroll: 22,          // VO 20.17s · terminal enroll-all + /season/3
  arenaLive: 27,       // VO 25.81s · season time-lapse + reorder
  settle: 21,          // VO 19.51s · keeper settle + podium reveal
  reputation: 12,      // VO 10.55s · agent detail iNFT + Trade Outcomes
  advantages: 18,      // VO 16.40s · 4 advantages bullets
  closing: 10,         // VO  8.46s · URL + install command
} as const;

export const SCENE_FRAMES = Object.fromEntries(
  Object.entries(SCENE_SECONDS).map(([k, sec]) => [k, sec * FPS]),
) as Record<keyof typeof SCENE_SECONDS, number>;

type SceneKey = keyof typeof SCENE_SECONDS;

const order: SceneKey[] = [
  'hook',
  'problem',
  'solutionIntro',
  'arch',
  'install',
  'backtest',
  'certifyMint',
  'frontend',
  'enroll',
  'arenaLive',
  'settle',
  'reputation',
  'advantages',
  'closing',
];

export const SCENE_START = order.reduce(
  (acc, key, i) => {
    acc[key] = i === 0 ? 0 : acc[order[i - 1]] + SCENE_FRAMES[order[i - 1]];
    return acc;
  },
  {} as Record<SceneKey, number>,
);

export const TOTAL_FRAMES = order.reduce(
  (acc, key) => acc + SCENE_FRAMES[key],
  0,
);

export const SCENE_ORDER = order;
