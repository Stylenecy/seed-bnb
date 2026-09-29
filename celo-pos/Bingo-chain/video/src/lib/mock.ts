// Demo data. Addresses are real operator wallets from apps/web/public/competition.json
// so identicons + the Cup leaderboard match what the live app would render.

export type ArenaState = "created" | "committed" | "playing" | "revealing" | "settled" | "cancelled";

export type MockArena = {
  id: number;
  stake: string;
  symbol: string;
  joined: number;
  max: number;
  state: ArenaState;
};

// Lobby grid (the "Open" filter shows `created` arenas first).
export const LOBBY_ARENAS: MockArena[] = [
  { id: 42, stake: "10", symbol: "LANCE", joined: 2, max: 4, state: "created" },
  { id: 41, stake: "0.5", symbol: "cUSD", joined: 1, max: 2, state: "created" },
  { id: 39, stake: "1", symbol: "CELO", joined: 3, max: 6, state: "created" },
  { id: 38, stake: "25", symbol: "LANCE", joined: 4, max: 6, state: "created" },
  { id: 36, stake: "0.5", symbol: "USDT", joined: 1, max: 4, state: "created" },
  { id: 34, stake: "50", symbol: "LANCE", joined: 5, max: 6, state: "created" },
];

// Players in the game we play through (me first).
export const ME = "0x00cAaDfCe680b38F4649848504eee1e7F147a2Af";
export const MY_NAME = "lance.eth";

export type GamePlayer = { address: string; name?: string };
export const GAME_PLAYERS: GamePlayer[] = [
  { address: ME, name: MY_NAME },
  { address: "0x40ABB46cBf56d7F9696cE68AE933900A167a68C9", name: "neo.celo" },
  { address: "0x5F45F49A14d039F3aD19080F2c4d77E799e8a466", name: "satoshi" },
  { address: "0x7d08AE2Ee75712122B584c8DD38dc4586895c2AD" },
];

// The arena we create + play (LANCE, 10 stake, 4 seats).
export const GAME_ARENA_ID = 43;
export const GAME_STAKE = "10";
export const GAME_SYMBOL = "LANCE";
export const GAME_POT = "40"; // 4 × 10

// My 5×5 board (cells 0..24 → number). A real-looking shuffle of 1..25.
export const MY_BOARD: number[] = [
  4, 17, 9, 22, 1,
  13, 6, 20, 11, 25,
  8, 19, 2, 15, 10,
  23, 5, 16, 7, 18,
  12, 24, 3, 21, 14,
];

// Call sequence by CELL index 0..20: completes row0→row1→row2→row3 (4 lines),
// then cell 20 completes col0 + the anti-diagonal → BINGO. The numbers below are
// MY_BOARD[cell] for cells 0..20, so the meter lights B→I→N→G→O as they land.
export const CALL_CELLS: number[] = Array.from({ length: 21 }, (_, i) => i);
export const CALL_SEQUENCE: number[] = CALL_CELLS.map((c) => MY_BOARD[c]);

// Which calls are "mine" (cursor taps) vs opponents — turn-based, 4 players.
export const MY_CALL_INDEXES = new Set(CALL_SEQUENCE.map((_, i) => i).filter((i) => i % 4 === 0));

// ── Cup ──────────────────────────────────────────────────────────────────────
export type CupEvent = {
  id: string;
  title: string;
  status: "live" | "past";
  endsAtFromNowSec: number;
  topN: number;
  prizePerWinner: string;
  token: string;
};

export const CUP_EVENTS: CupEvent[] = [
  { id: "genesis", title: "Genesis Cup", status: "live", endsAtFromNowSec: 2 * 86400 + 6 * 3600 + 1452, topN: 10, prizePerWinner: "20", token: "LANCE" },
  { id: "sprint", title: "Weekend Sprint", status: "live", endsAtFromNowSec: 11 * 3600 + 320, topN: 5, prizePerWinner: "15", token: "LANCE" },
  { id: "season1", title: "Season 1 Open", status: "live", endsAtFromNowSec: 4 * 86400 + 900, topN: 3, prizePerWinner: "50", token: "LANCE" },
];

export type LeaderRow = { rank: number; address: string; name?: string; games: number; wins: number; volume: string };

// Top of the Genesis Cup leaderboard (mirrors competition.json ordering).
export const CUP_LEADERBOARD: LeaderRow[] = [
  { rank: 1, address: "0x00cAaDfCe680b38F4649848504eee1e7F147a2Af", name: "lance.eth", games: 7, wins: 4, volume: "70" },
  { rank: 2, address: "0x40ABB46cBf56d7F9696cE68AE933900A167a68C9", name: "neo.celo", games: 7, wins: 3, volume: "70" },
  { rank: 3, address: "0x5F45F49A14d039F3aD19080F2c4d77E799e8a466", name: "satoshi", games: 7, wins: 3, volume: "70" },
  { rank: 4, address: "0x7d08AE2Ee75712122B584c8DD38dc4586895c2AD", games: 6, wins: 2, volume: "60" },
  { rank: 5, address: "0x905fEFA5fd00EC170C840fDf19980928ae100749", games: 6, wins: 2, volume: "60" },
  { rank: 6, address: "0xA1386ED8274b263f9cBF552b3a99324d28dBFd36", games: 6, wins: 2, volume: "60" },
  { rank: 7, address: "0x176564a3b264DDAA8D65F85878D50476A7c52342", games: 6, wins: 1, volume: "60" },
  { rank: 8, address: "0x0AC7b791225Dfe2687be41D1C6bcC5B2378a0C83", games: 6, wins: 1, volume: "60" },
];

// ── Profile ─────────────────────────────────────────────────────────────────
export type PlayerStats = { games: number; wins: number; volume: string; earnings: string };
export const MY_STATS: PlayerStats = { games: 12, wins: 5, volume: "140", earnings: "186" };

export type RecentGame = { arenaId: number; outcome: "win" | "loss" | "cancelled"; prize: string; stake: string };
export const MY_RECENT: RecentGame[] = [
  { arenaId: 43, outcome: "win", prize: "40", stake: "10" },
  { arenaId: 40, outcome: "win", prize: "30", stake: "10" },
  { arenaId: 37, outcome: "loss", prize: "0", stake: "10" },
  { arenaId: 33, outcome: "win", prize: "50", stake: "25" },
  { arenaId: 29, outcome: "loss", prize: "0", stake: "10" },
  { arenaId: 24, outcome: "cancelled", prize: "0", stake: "10" },
];
