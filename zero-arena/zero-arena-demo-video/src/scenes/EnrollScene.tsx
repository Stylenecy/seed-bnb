// EnrollScene — 15 seconds, 450 frames @ 30fps.
//
// PLAN §4 storyboard #9: split layout. Left = MacTerminal with
// `npm run season:enroll-all 3`. 5 tokens enroll one-by-one. Right =
// MacBrowser fades in showing the /season/3 page mirror with status
// badge, prize pool, 4-stat grid, and empty leaderboard (rows present
// but "Not started" — fills in during the ArenaLive scene next).
//
// Frame budget:
//   0–25     split layout enters
//   25–80    `npm run season:enroll-all 3` typed
//   80–260   5 token enroll lines drop in (36 frames apart)
//   260–285  ✓ Season #3 now has 5 participants
//   285–310  browser fades in
//   310–380  season header + status badge + 4-stat grid
//   380–450  leaderboard table populates (status "Not started", metrics "—")

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacTerminal, TerminalCursor} from '../components/MacTerminal';
import {MacBrowser} from '../components/MacBrowser';

// FE-mirror tailwind→theme map
const ZINC_900 = '#18181b';
const ZINC_800 = '#27272a';
const ZINC_500 = '#71717a';
const ZINC_400 = '#a1a1aa';
const ZINC_300 = '#d4d4d8';
const ZINC_100 = theme.text;
const EMERALD = theme.accent;
const AMBER = '#fcd34d';

const OWNER_SHORT = '0xB1a5…0DbD';

interface TokenEnroll {
  rank: number;
  tokenId: number;
  name: string;
  block: number;
  avatarBg: string;
  avatar: string;
}

const TOKENS: TokenEnroll[] = [
  {rank: 1, tokenId: 12, name: 'Perp Momentum 10x',      block: 33570281, avatarBg: '#fbbf24', avatar: 'P'},
  {rank: 2, tokenId: 8,  name: 'Volatility Breakout 5x', block: 33570302, avatarBg: '#0ea5e9', avatar: 'V'},
  {rank: 3, tokenId: 11, name: 'Funding Rate Hunter',    block: 33570322, avatarBg: '#a78bfa', avatar: 'F'},
  {rank: 4, tokenId: 9,  name: 'Trend Follower 3x',      block: 33570344, avatarBg: '#f59e0b', avatar: 'T'},
  {rank: 5, tokenId: 10, name: 'Mean Revert Perp 5x',    block: 33570366, avatarBg: '#ef4444', avatar: 'M'},
];

// ─── typing helpers ──────────────────────────────────────────────────────

const typed = (full: string, frame: number, startFrame: number, cps: number) => {
  if (frame < startFrame) return '';
  const chars = Math.floor(((frame - startFrame) * cps) / 30);
  return full.slice(0, Math.min(chars, full.length));
};

const doneTyping = (full: string, frame: number, startFrame: number, cps: number) =>
  frame >= startFrame + Math.ceil((full.length * 30) / cps);

const shortHash = (n: number) => `0x${n.toString(16).padStart(8, '0')}${'a'.repeat(8)}`;

// ─── scene ────────────────────────────────────────────────────────────────

export const EnrollScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Terminal entrance (left)
  const tOp = interpolate(frame, [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tx = interpolate(frame, [0, 25], [-80, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  // Browser entrance (right) — slides in starting at frame 285
  const bOp = interpolate(frame, [285, 320], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bx = interpolate(frame, [285, 320], [80, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  // Command typing
  const cmd = 'npm run season:enroll-all 3';
  const cmdDone = doneTyping(cmd, frame, 25, 32);

  // Terminal auto-scroll as enroll lines accumulate
  const termScrollY = interpolate(frame, [180, 280], [0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const cursor = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{display: 'flex', gap: 20, alignItems: 'flex-start'}}>
        {/* ── LEFT: Terminal ───────────────────────────────────────── */}
        <div style={{opacity: tOp, transform: `translateX(${tx}px)`}}>
          <MacTerminal title="zero-arena — zsh" width={820} height={820}>
            <div style={{position: 'relative', height: '100%', overflow: 'hidden'}}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  background: `linear-gradient(to bottom, ${theme.bgElev}, rgba(20,20,28,0))`,
                  zIndex: 2,
                  pointerEvents: 'none',
                  opacity: interpolate(frame, [180, 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                }}
              />
              <div
                style={{
                  transform: `translateY(${-termScrollY}px)`,
                  fontSize: 22,
                  lineHeight: 1.5,
                }}
              >
                {/* command */}
                <Line>
                  <Prompt />
                  <span>{typed(cmd, frame, 25, 32)}</span>
                  {!cmdDone && <TerminalCursor visible={cursor} />}
                </Line>

                {/* enroll lines per token */}
                {TOKENS.map((t, i) => {
                  const showAt = 80 + i * 36;
                  return (
                    <EnrollBlock
                      key={t.tokenId}
                      token={t}
                      frame={frame}
                      showAt={showAt}
                    />
                  );
                })}

                {/* success */}
                {frame >= 260 && (
                  <>
                    <Spacer />
                    <Line>
                      <span style={{color: EMERALD, fontWeight: 700}}>✓</span>{' '}
                      <span style={{color: ZINC_100}}>
                        Season #3 now has{' '}
                        <span style={{color: EMERALD, fontWeight: 600}}>5 participants</span>
                      </span>
                    </Line>
                  </>
                )}
              </div>
            </div>
          </MacTerminal>
        </div>

        {/* ── RIGHT: Browser (fades in after frame 285) ────────────── */}
        <div style={{opacity: bOp, transform: `translateX(${bx}px)`}}>
          <MacBrowser url="zero-arena-fe.vercel.app/season/3" width={1020} height={820}>
            <SeasonDetailPage frame={frame} />
          </MacBrowser>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── enroll block component ──────────────────────────────────────────────

const EnrollBlock: React.FC<{token: TokenEnroll; frame: number; showAt: number}> = ({
  token,
  frame,
  showAt,
}) => {
  const op = interpolate(frame, [showAt, showAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{opacity: op, marginTop: 8}}>
      <Line>
        <span style={{color: theme.textMuted, marginRight: 6}}>▸</span>
        <span style={{color: theme.text}}>{token.name}</span>
        <span style={{color: theme.textDim, marginLeft: 8}}>
          (token #{token.tokenId})
        </span>
      </Line>
      <Line>
        <span style={{paddingLeft: 24, color: EMERALD}}>✓</span>
        <span style={{color: theme.textMuted, marginLeft: 8}}>
          enrolled · start tx
        </span>
        <span style={{color: theme.text, marginLeft: 8, fontFamily: fonts.mono, fontSize: 18}}>
          {shortHash(token.block)}
        </span>
      </Line>
    </div>
  );
};

const Prompt: React.FC = () => (
  <>
    <span style={{color: EMERALD}}>kiel</span>
    <span style={{color: theme.textDim}}>@</span>
    <span style={{color: theme.text}}>arena</span>
    <span style={{color: theme.textDim}}>:~/examples</span>
    <span style={{color: theme.textMuted}}>$ </span>
  </>
);

const Line: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', flexWrap: 'wrap'}}>{children}</div>
);

const Spacer: React.FC = () => <div style={{height: 12}} />;

// ─── season detail page mirror (FE /season/[id]/page.tsx) ────────────────

const SeasonDetailPage: React.FC<{frame: number}> = ({frame}) => {
  const headerOp = interpolate(frame, [310, 340], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const statsOp = interpolate(frame, [340, 370], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tableOp = interpolate(frame, [380, 410], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Countdown that ticks down — start at 27m, decrement by 1s per 30 frames
  const baseSeconds = 27 * 60;
  const elapsed = Math.max(0, frame - 320);
  const remaining = Math.max(0, baseSeconds - Math.floor(elapsed / 30));
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div style={{fontFamily: fonts.sans, color: ZINC_100, padding: '18px 22px 8px'}}>
      {/* Breadcrumb */}
      <div style={{opacity: headerOp, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ZINC_500}}>
        <span>Seasons</span>
        <span>/</span>
        <span style={{color: ZINC_300}}>#2</span>
      </div>

      {/* Title + Aristotle live + status + prize */}
      <div
        style={{
          opacity: headerOp,
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{fontSize: 22, fontWeight: 700, letterSpacing: -0.6}}>Season #3 · Perp Mayhem</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                border: `1px solid ${EMERALD}66`,
                background: 'rgba(52, 211, 153, 0.1)',
                color: EMERALD,
                padding: '3px 7px',
                borderRadius: 5,
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  background: EMERALD,
                }}
              />
              Aristotle live
            </span>
          </div>
          <div style={{marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11}}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                border: `1px solid ${EMERALD}66`,
                background: 'rgba(52, 211, 153, 0.1)',
                color: EMERALD,
                padding: '3px 7px',
                borderRadius: 5,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  background: EMERALD,
                }}
              />
              Ends in {mm}m {String(ss).padStart(2, '0')}s
            </span>
            <span style={{color: ZINC_500}}>May 16, 2026 → May 16, 2026</span>
          </div>
        </div>

        <div style={{textAlign: 'right'}}>
          <div
            style={{
              fontSize: 9,
              color: ZINC_500,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Prize Pool
          </div>
          <div style={{fontSize: 22, fontWeight: 700, color: AMBER, fontFamily: fonts.mono, marginTop: 2}}>
            100,000 0G
          </div>
          <div style={{fontSize: 9, color: ZINC_500, marginTop: 2}}>
            Top-3 split 50% / 30% / 20%
          </div>
        </div>
      </div>

      {/* 4-stat grid */}
      <div
        style={{
          opacity: statsOp,
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
      >
        <StatCard label="Market" value="Perp · 10x max" />
        <StatCard label="Initial Balance" value="10,000 USDT" />
        <StatCard label="Fees / Slippage" value="0.10% / 0.05%" />
        <StatCard label="Participants" value="5" highlight />
      </div>

      {/* Creator line */}
      <div style={{opacity: statsOp, marginTop: 10, fontSize: 10, color: ZINC_500}}>
        Created by <span style={{fontFamily: fonts.mono, color: ZINC_300}}>{OWNER_SHORT}</span>
        {' · '}
        datasetSpec{' '}
        <span style={{fontFamily: fonts.mono, background: ZINC_800, padding: '1px 5px', borderRadius: 3, color: ZINC_300}}>
          0xdcc2a4da7d2d…
        </span>
      </div>

      {/* Leaderboard table — empty/fresh state */}
      <div
        style={{
          opacity: tableOp,
          marginTop: 18,
          borderRadius: 16,
          border: `1px solid ${ZINC_800}cc`,
          background: 'rgba(24, 24, 27, 0.4)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 100px 110px 80px 90px 90px 70px',
            padding: '8px 12px',
            background: 'rgba(24, 24, 27, 0.6)',
            color: ZINC_500,
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            borderBottom: `1px solid ${ZINC_900}`,
          }}
        >
          <span>#</span>
          <span>Agent</span>
          <span>Status</span>
          <span style={{textAlign: 'right'}}>Live Return</span>
          <span style={{textAlign: 'right'}}>Sharpe</span>
          <span style={{textAlign: 'right'}}>Win Rate</span>
          <span style={{textAlign: 'right'}}>Max DD</span>
          <span style={{textAlign: 'right'}}>Epochs</span>
        </div>
        {TOKENS.map((t, i) => (
          <SeasonRow key={t.tokenId} token={t} index={i} frame={frame} />
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{label: string; value: string; highlight?: boolean}> = ({
  label,
  value,
  highlight,
}) => (
  <div
    style={{
      borderRadius: 10,
      border: `1px solid ${highlight ? `${EMERALD}66` : ZINC_800}`,
      background: highlight ? 'rgba(52, 211, 153, 0.06)' : 'rgba(24, 24, 27, 0.6)',
      padding: '10px 12px',
    }}
  >
    <div
      style={{
        fontSize: 9,
        color: ZINC_500,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: highlight ? EMERALD : ZINC_100,
        marginTop: 4,
        fontFamily: highlight ? fonts.mono : fonts.sans,
      }}
    >
      {value}
    </div>
  </div>
);

const SeasonRow: React.FC<{token: TokenEnroll; index: number; frame: number}> = ({
  token,
  index,
  frame,
}) => {
  const showAt = 380 + index * 8;
  const op = interpolate(frame, [showAt, showAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // After enrollment, status is "Not started" (no live cert update yet during this scene)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 100px 110px 80px 90px 90px 70px',
        padding: '8px 12px',
        borderBottom: `1px solid ${ZINC_900}88`,
        alignItems: 'center',
        opacity: op,
        fontSize: 11,
      }}
    >
      <span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 22,
            background: ZINC_800,
            color: ZINC_400,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {token.rank}
        </span>
      </span>
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 22,
            background: token.avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0a0f',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {token.avatar}
        </div>
        <span style={{color: ZINC_100, fontSize: 11, fontWeight: 500}}>{token.name}</span>
      </div>
      <span style={{color: ZINC_500, fontSize: 10}}>Not started</span>
      <span style={{textAlign: 'right', color: '#3f3f46', fontFamily: fonts.mono}}>—</span>
      <span style={{textAlign: 'right', color: '#3f3f46', fontFamily: fonts.mono}}>—</span>
      <span style={{textAlign: 'right', color: '#3f3f46', fontFamily: fonts.mono}}>—</span>
      <span style={{textAlign: 'right', color: '#3f3f46', fontFamily: fonts.mono}}>—</span>
      <span style={{textAlign: 'right', color: ZINC_400, fontFamily: fonts.mono}}>0</span>
    </div>
  );
};
