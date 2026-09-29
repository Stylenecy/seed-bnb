import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Trophy } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { BoardBuilder } from "../components/BoardBuilder";
import { BoardGrid } from "../components/BoardGrid";
import { BingoMeter } from "../components/BingoMeter";
import { Player } from "../components/Player";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { Cursor } from "../components/Cursor";
import { cn } from "../lib/cn";
import { completedLines } from "../lib/board";
import {
  MY_BOARD,
  CALL_SEQUENCE,
  CALL_CELLS,
  GAME_PLAYERS,
  GAME_ARENA_ID,
  GAME_STAKE,
  GAME_SYMBOL,
  GAME_POT,
  ME,
  MY_NAME,
} from "../lib/mock";

// Phase boundaries (frames @30fps).
const AUTOFILL_CLICK = 42;
const FILL_START = 50;
const JOIN_CLICK = 150;
const PLAY_START = 205;
const CALL_START = 238;
const CALL_INTERVAL = 15;
const NUM_CALLS = CALL_SEQUENCE.length; // 21
const BINGO_FRAME = CALL_START + (NUM_CALLS - 1) * CALL_INTERVAL; // ~538
const CLAIM_CLICK = BINGO_FRAME + 86;
const WIN_START = CLAIM_CLICK + 18;

/** /arena/43 — the whole match: build a board, join, play turn-by-turn, hit
 *  BINGO, claim, and see the verifiable result. Mirrors app/arena/[id]/page.tsx. */
export function Game() {
  const frame = useCurrentFrame();
  const phase = frame < PLAY_START ? "build" : frame < WIN_START ? "play" : "win";

  // ── Board auto-fill (build phase) ──
  const fillCount = Math.round(interpolate(frame, [FILL_START, FILL_START + 52], [0, 25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const draft: (number | null)[] = MY_BOARD.map((n, i) => (i < fillCount ? n : null));
  const joined = frame >= JOIN_CLICK + 14;

  // ── Calls (play phase) ──
  const callsLanded = phase === "play"
    ? Math.max(0, Math.min(NUM_CALLS, Math.floor((frame - CALL_START) / CALL_INTERVAL) + 1))
    : phase === "win"
      ? NUM_CALLS
      : 0;
  const calledNums = CALL_SEQUENCE.slice(0, callsLanded);
  const called = new Set(calledNums);
  const lines = completedLines(MY_BOARD, called);
  const lastCalled = callsLanded > 0 ? CALL_SEQUENCE[callsLanded - 1] : undefined;
  const lastCallFrame = CALL_START + (callsLanded - 1) * CALL_INTERVAL;
  const lastPulse = interpolate(frame - lastCallFrame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // The next cell to be called is highlighted (cursor "hovering" it on my turn).
  const nextCell = callsLanded < NUM_CALLS ? CALL_CELLS[callsLanded] : null;
  const myTurn = phase === "play" && lines < 5;
  const bingo = lines >= 5;

  // joinedCount + players row
  const joinedCount = phase === "build" ? (joined ? 2 : 1) : 4;
  const playersRow = phase === "build"
    ? (joined ? GAME_PLAYERS.slice(0, 2) : [GAME_PLAYERS[1]])
    : GAME_PLAYERS;
  const turnIdx = phase === "play" ? (callsLanded % GAME_PLAYERS.length) : -1;

  const stateLabel = phase === "build" ? "Created" : phase === "play" ? "Playing" : "Settled";
  const stateVariant = phase === "build" ? "open" : phase === "play" ? "playing" : "settled";

  // ── Cursor ──
  let cx = 960, cy = 540, down = 0;
  if (phase === "build") {
    cx = interpolate(frame, [16, 36, 120, JOIN_CLICK], [900, 1150, 1150, 960], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    cy = interpolate(frame, [16, 36, 120, JOIN_CLICK], [430, 470, 470, 880], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    down = interpolate(frame, [AUTOFILL_CLICK - 6, AUTOFILL_CLICK, AUTOFILL_CLICK + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      + interpolate(frame, [JOIN_CLICK - 6, JOIN_CLICK, JOIN_CLICK + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (phase === "play" && !bingo) {
    // Hover the next-to-call cell on the board (board is the call pad).
    cx = interpolate(frame, [PLAY_START, CALL_START], [700, 880], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cy = interpolate(frame, [PLAY_START, CALL_START], [620, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const local = (frame - CALL_START) % CALL_INTERVAL;
    down = interpolate(local, [0, 3, 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    // BINGO → claim button
    cx = interpolate(frame, [BINGO_FRAME, CLAIM_CLICK], [900, 960], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cy = interpolate(frame, [BINGO_FRAME, CLAIM_CLICK], [700, 880], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    down = interpolate(frame, [CLAIM_CLICK - 6, CLAIM_CLICK, CLAIM_CLICK + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }

  const claimGlow = 0.6 + 0.4 * Math.sin((frame - BINGO_FRAME) / 4);

  return (
    <AppShell active="/arenas">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-6">
        <span className="inline-flex items-center gap-1 self-start font-mono text-xs text-muted-foreground">← Back</span>
        <PageHeader
          eyebrow="Live arena"
          title={<>Arena <span className="font-mono text-neon">#{GAME_ARENA_ID}</span></>}
        />

        <div className="glass flex items-center justify-between rounded-xl p-3.5 text-sm">
          <Badge variant={stateVariant} dot={phase === "play"}>{stateLabel}</Badge>
          <span className="font-mono text-muted-foreground">
            {joinedCount}/4 · {GAME_STAKE} {GAME_SYMBOL}
          </span>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Players · {joinedCount}/4</p>
          <div className="flex flex-wrap gap-2">
            {playersRow.map((p, i) => {
              const isTurn = turnIdx === GAME_PLAYERS.indexOf(p);
              const isMe = p.address.toLowerCase() === ME.toLowerCase();
              return (
                <span
                  key={p.address}
                  className={cn("glass flex items-center gap-2 rounded-full py-1 pl-1 pr-3", isTurn && "ring-1 ring-gold-400/60")}
                >
                  <PlayerAvatar address={p.address} size={22} />
                  <span className={p.name ? "text-xs font-medium text-foreground" : "font-mono text-xs text-foreground"}>
                    {p.name ?? `${p.address.slice(0, 6)}…${p.address.slice(-4)}`}
                    {isMe && <span className="text-gold-300"> · you</span>}
                  </span>
                  {isTurn && <span className="size-1.5 rounded-full bg-gold-400" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* BUILD */}
        {phase === "build" && !joined && (
          <div className="glass space-y-4 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-anton text-base uppercase text-cream">Build your board</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Drag numbers into the grid (or tap a number, then a cell). Numbers are called 1-25 in turn, so place them to complete lines early.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm">Auto-fill</Button>
                <Button variant="ghost" size="sm">Clear</Button>
              </div>
            </div>
            <BoardBuilder value={draft} />
            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-xs">
              <span className="text-muted-foreground">Stake <span className="text-cream">{GAME_STAKE} {GAME_SYMBOL}</span></span>
              <span className="text-muted-foreground">You have 140 {GAME_SYMBOL}</span>
            </div>
            <Button size="lg" className="w-full">
              {fillCount < 25 ? `Place all 25 numbers (${fillCount}/25)` : "Join with this board"}
            </Button>
          </div>
        )}
        {phase === "build" && joined && (
          <p className="text-sm text-state-open">Joined — waiting for the arena to fill.</p>
        )}

        {/* PLAY */}
        {phase === "play" && (
          <div className="mx-auto w-full max-w-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Your board · <span className="text-gold-300">{Math.min(lines, 5)}/5</span> lines
              </p>
              {bingo ? (
                <span className="font-mono text-xs font-medium text-neon">BINGO — claim your win</span>
              ) : myTurn ? (
                <span className="font-mono text-xs font-medium text-state-open">Your turn — tap a number to call</span>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">Calling…</span>
              )}
            </div>
            <BoardGrid
              board={MY_BOARD}
              called={called}
              lastCalled={lastCalled}
              lastPulse={lastPulse}
              highlightCell={myTurn ? nextCell : null}
              callable
            />
            <BingoMeter lines={lines} pulse={bingo} />
            {bingo ? (
              <div
                className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
                style={{ boxShadow: `0 0 0 1px hsl(var(--gold-400) / 0.3), 0 10px 36px -8px hsl(var(--gold-400) / ${0.35 * claimGlow})` }}
              >
                Claim BINGO!
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">Complete 5 lines (B-I-N-G-O) to claim.</p>
            )}
          </div>
        )}

        {/* WIN */}
        {phase === "win" && (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 ring-1 ring-neon/50 shadow-glow">
              <p className="mb-3 flex items-center gap-2 font-anton text-lg uppercase text-cream">
                <Trophy className="size-5 text-neon" />
                You won!
                <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">{GAME_POT} pot</span>
              </p>
              <div className="flex items-center justify-between">
                <Player address={ME} name={MY_NAME} size="sm" />
                <span className="font-mono text-sm font-semibold text-neon">+{GAME_POT}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Revealed boards · verifiable</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass space-y-2 rounded-xl p-3 ring-1 ring-neon/40">
                  <div className="flex items-center justify-between">
                    <Player address={ME} name={MY_NAME} size="sm" />
                    <Badge variant="gold">WON</Badge>
                  </div>
                  <BoardGrid board={MY_BOARD} called={called} />
                  <BingoMeter lines={5} />
                </div>
                <div className="glass space-y-2 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <Player address={GAME_PLAYERS[1].address} name={GAME_PLAYERS[1].name} size="sm" />
                  </div>
                  <BoardGrid board={OPP_BOARD} called={called} />
                  <BingoMeter lines={completedLines(OPP_BOARD, called)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Cursor x={cx} y={cy} down={Math.min(1, down)} />
    </AppShell>
  );
}

// An opponent's revealed board (a different shuffle) — for the verifiable grid.
const OPP_BOARD = [
  10, 3, 18, 1, 24,
  7, 22, 5, 15, 11,
  19, 2, 13, 25, 6,
  4, 17, 21, 8, 14,
  23, 9, 16, 12, 20,
];
