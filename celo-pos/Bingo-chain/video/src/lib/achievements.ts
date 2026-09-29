import type { PlayerStats } from "./mock";

export type Achievement = {
  key: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
};

/** Copied verbatim from apps/web/lib/achievements.ts. */
export function achievementsFor(stats: PlayerStats | null): Achievement[] {
  const games = stats?.games ?? 0;
  const wins = stats?.wins ?? 0;
  const volume = stats ? parseFloat(stats.volume) || 0 : 0;
  const winRate = games > 0 ? wins / games : 0;

  return [
    { key: "first-game", label: "First Steps", description: "Play your first arena", icon: "sparkles", earned: games >= 1 },
    { key: "regular", label: "Regular", description: "Play 5 arenas", icon: "dices", earned: games >= 5 },
    { key: "veteran", label: "Veteran", description: "Play 10 arenas", icon: "swords", earned: games >= 10 },
    { key: "first-win", label: "First Blood", description: "Win an arena", icon: "medal", earned: wins >= 1 },
    { key: "contender", label: "Contender", description: "Win 3 arenas", icon: "award", earned: wins >= 3 },
    { key: "master", label: "BINGO Master", description: "Win 5 arenas", icon: "trophy", earned: wins >= 5 },
    { key: "high-roller", label: "High Roller", description: "Stake 100+ $LANCE total", icon: "coins", earned: volume >= 100 },
    { key: "whale", label: "Whale", description: "Stake 500+ $LANCE total", icon: "gem", earned: volume >= 500 },
    { key: "sharpshooter", label: "Sharpshooter", description: "30%+ win rate over 5+ games", icon: "target", earned: games >= 5 && winRate >= 0.3 },
  ];
}
