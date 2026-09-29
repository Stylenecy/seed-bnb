// Board geometry + line logic — copied from apps/web/lib/board.ts (the pure
// parts; no viem/crypto needed for the demo).

export const BOARD_SIZE = 25;

/// The 12 winning lines as cell-index sets (rows, cols, diagonals).
export const LINES: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

/// Number of completed lines given the set of called numbers.
export function completedLines(board: number[], called: Set<number>): number {
  const marked = board.map((n) => called.has(n));
  return LINES.filter((line) => line.every((cell) => marked[cell])).length;
}

/// Indices into LINES of the lines that are fully marked.
export function completedLineIndices(board: number[], called: Set<number>): number[] {
  const marked = board.map((n) => called.has(n));
  return LINES.map((line, i) => (line.every((cell) => marked[cell]) ? i : -1)).filter((i) => i >= 0);
}
