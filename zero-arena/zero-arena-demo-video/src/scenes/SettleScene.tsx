// SettleScene — 15 seconds, 450 frames @ 30fps.
//
// PLAN §4 storyboard #11: continues /season/3 in "Awaiting settlement"
// state. A small MacTerminal popup shows the season-keeper daemon
// auto-firing Season.settle(...). Page status flips to "Settled", podium
// rank pills become gold/silver/bronze with winner crown, then a prize
// distribution overlay reveals each top-3 transfer.
//
// Frame budget:
//   0–25     scene crossfades in
//   25–45    terminal popup slides in (corner overlay)
//   45–170   keeper logs + Season.settle tx
//   170–200  terminal fades out, page status flips Awaiting → Settled
//   200–280  podium reveal: rank pills color, winner glow + crown
//   280–380  prize transfer overlay: 50% / 30% / 20% to top-3
//   380–450  caption: permissionless settle · winner takes prize · immutable record

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacBrowser} from '../components/MacBrowser';
import {MacTerminal, TerminalCursor} from '../components/MacTerminal';

const ZINC_900 = '#18181b';
const ZINC_800 = '#27272a';
const ZINC_500 = '#71717a';
const ZINC_400 = '#a1a1aa';
const ZINC_300 = '#d4d4d8';
const ZINC_100 = theme.text;
const EMERALD = theme.accent;
const ROSE = theme.negReturn;
const AMBER = '#fcd34d';
const BRONZE = '#b45309';

const OWNER_SHORT = '0xB1a5…0DbD';
const SETTLE_TX = '0x9c4d28e7f3b1a5c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1';

interface FinalRow {
  rank: number;
  tokenId: number;
  certId: number;
  name: string;
  avatar: string;
  avatarBg: string;
  returnBps: number;
  sharpeX1000: number;
  winBps: number;
  ddBps: number;
  epochs: number;
  prize?: string; // populated for top-3
  prizeBps?: number;
}

const FINAL_RANKING: FinalRow[] = [
  {rank: 1, tokenId: 12, certId: 12, name: 'Perp Momentum 10x',      avatar: 'P', avatarBg: '#fbbf24', returnBps: 14700, sharpeX1000: 2840, winBps: 6800, ddBps: 1240, epochs: 11, prize: '50,000 0G', prizeBps: 5000},
  {rank: 2, tokenId: 8,  certId: 9,  name: 'Volatility Breakout 5x', avatar: 'V', avatarBg: '#0ea5e9', returnBps: 6420,  sharpeX1000: 1980, winBps: 5800, ddBps: 1850, epochs: 11, prize: '30,000 0G', prizeBps: 3000},
  {rank: 3, tokenId: 11, certId: 11, name: 'Funding Rate Hunter',    avatar: 'F', avatarBg: '#a78bfa', returnBps: 1890,  sharpeX1000: 1320, winBps: 5400, ddBps: 980,  epochs: 11, prize: '20,000 0G', prizeBps: 2000},
  {rank: 4, tokenId: 9,  certId: 10, name: 'Trend Follower 3x',      avatar: 'T', avatarBg: '#f59e0b', returnBps: -3200, sharpeX1000: -890, winBps: 4200, ddBps: 4100, epochs: 11},
  {rank: 5, tokenId: 10, certId: 13, name: 'Mean Revert Perp 5x',    avatar: 'M', avatarBg: '#ef4444', returnBps: -6840, sharpeX1000: -2140, winBps: 3200, ddBps: 7200, epochs: 11},
];

const typed = (full: string, frame: number, startFrame: number, cps: number) => {
  if (frame < startFrame) return '';
  const chars = Math.floor(((frame - startFrame) * cps) / 30);
  return full.slice(0, Math.min(chars, full.length));
};

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-8)}`;

// ─── scene ────────────────────────────────────────────────────────────────

export const SettleScene: React.FC = () => {
  const frame = useCurrentFrame();

  const browserOp = interpolate(frame, [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Settled flips at frame 170
  const settled = frame >= 170;

  // Terminal popup: slides in at 25, fades out at 170
  const termOp = interpolate(frame, [25, 45, 170, 190], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const termX = interpolate(frame, [25, 45], [60, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const cursor = Math.floor(frame / 15) % 2 === 0;

  // Caption fade
  const captionOp = interpolate(frame, [380, 410], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: browserOp, position: 'relative'}}>
        <MacBrowser url="zero-arena-fe.vercel.app/season/3" width={1620} height={920}>
          <SettledPage frame={frame} settled={settled} />
        </MacBrowser>

        {/* Terminal popup at top-right */}
        {frame >= 25 && frame < 200 && (
          <div
            style={{
              position: 'absolute',
              top: 60,
              right: -60,
              opacity: termOp,
              transform: `translateX(${termX}px)`,
              zIndex: 5,
            }}
          >
            <MacTerminal title="season-keeper · railway" width={720} height={520}>
              <KeeperTerminal frame={frame} cursor={cursor} />
            </MacTerminal>
          </div>
        )}
      </div>

      {/* Bottom caption */}
      {frame >= 380 && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontFamily: fonts.mono,
            fontSize: 18,
            color: theme.textMuted,
            opacity: captionOp,
            letterSpacing: 0.5,
            textAlign: 'center',
          }}
        >
          <span style={{color: theme.textDim}}>// </span>
          permissionless settle · winner takes the prize ·{' '}
          <span style={{color: EMERALD, fontWeight: 600}}>immutable on-chain</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── keeper terminal ─────────────────────────────────────────────────────

const KeeperTerminal: React.FC<{frame: number; cursor: boolean}> = ({frame, cursor}) => {
  const line1 = '▸ season-keeper: detected season #3 ready for settlement';
  const line2 = '▸ building sorted leaderboard hint…';
  const cmd = 'Season.settle(3, [12, 8, 11, 9, 10])';

  return (
    <div style={{fontSize: 18, lineHeight: 1.55}}>
      {frame >= 50 && (
        <div style={{color: theme.textMuted}}>
          <span style={{color: theme.text}}>{typed(line1, frame, 50, 80)}</span>
        </div>
      )}
      {frame >= 80 && (
        <div style={{color: theme.textMuted, marginTop: 6}}>
          <span style={{color: theme.text}}>{typed(line2, frame, 80, 80)}</span>
        </div>
      )}
      {frame >= 105 && (
        <div style={{marginTop: 14}}>
          <span style={{color: theme.accent}}>$</span>{' '}
          <span style={{color: theme.text}}>{typed(cmd, frame, 105, 32)}</span>
          {frame < 145 && <TerminalCursor visible={cursor} />}
        </div>
      )}
      {frame >= 150 && (
        <div style={{marginTop: 14, paddingLeft: 24}}>
          <span style={{color: theme.accent, fontWeight: 700}}>✓</span>{' '}
          <span style={{color: theme.textMuted}}>settle tx</span>{' '}
          <span style={{color: theme.text, fontFamily: fonts.mono, fontSize: 16}}>
            {short(SETTLE_TX)}
          </span>
        </div>
      )}
      {frame >= 160 && (
        <div style={{marginTop: 10, paddingLeft: 24, color: theme.textMuted}}>
          <span style={{color: AMBER}}>▸</span> prize 100,000 0G → distributed (50% / 30% / 20%)
        </div>
      )}
    </div>
  );
};

// ─── settled page ────────────────────────────────────────────────────────

const SettledPage: React.FC<{frame: number; settled: boolean}> = ({frame, settled}) => {
  // Status flip animation — when settled becomes true at 170
  const settleFlash = interpolate(frame, [170, 180, 200], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Podium row enhancements appear after settle
  const podiumOp = interpolate(frame, [200, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{fontFamily: fonts.sans, color: ZINC_100, padding: '20px 24px'}}>
      {/* Breadcrumb */}
      <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ZINC_500}}>
        <span>Seasons</span>
        <span>/</span>
        <span style={{color: ZINC_300}}>#2</span>
      </div>

      {/* Title row */}
      <div style={{marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{fontSize: 24, fontWeight: 700, letterSpacing: -0.6}}>Season #3 · Perp Mayhem</span>
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
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              <span style={{width: 6, height: 6, borderRadius: 6, background: EMERALD}} />
              Aristotle live
            </span>
          </div>
          <div style={{marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12}}>
            {settled ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  border: `1px solid ${EMERALD}66`,
                  background: `rgba(52, 211, 153, ${0.12 + settleFlash * 0.2})`,
                  color: EMERALD,
                  padding: '4px 10px',
                  borderRadius: 5,
                  fontWeight: 600,
                  boxShadow: settleFlash > 0 ? `0 0 ${settleFlash * 24}px rgba(52,211,153,${settleFlash * 0.5})` : 'none',
                }}
              >
                ✓ Settled
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  border: '1px solid #f59e0b66',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: AMBER,
                  padding: '4px 8px',
                  borderRadius: 5,
                  fontWeight: 600,
                }}
              >
                Awaiting settlement
              </span>
            )}
            <span style={{color: ZINC_500}}>May 16, 2026 → May 16, 2026</span>
            {settled && (
              <span style={{color: ZINC_500, fontFamily: fonts.mono, fontSize: 11}}>
                settle tx{' '}
                <span style={{color: ZINC_300}}>{short(SETTLE_TX)}</span>
              </span>
            )}
          </div>
        </div>

        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: 10, color: ZINC_500, letterSpacing: 1.2, textTransform: 'uppercase'}}>
            Prize Pool {settled && <span style={{color: EMERALD}}>· distributed</span>}
          </div>
          <div style={{fontSize: 24, fontWeight: 700, color: AMBER, fontFamily: fonts.mono, marginTop: 2}}>
            100,000 0G
          </div>
          <div style={{fontSize: 10, color: ZINC_500, marginTop: 2}}>Top-3 split 50% / 30% / 20%</div>
        </div>
      </div>

      {/* 4-stat grid */}
      <div style={{marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12}}>
        <StatCard label="Market" value="Perp · 10x max" />
        <StatCard label="Initial Balance" value="10,000 USDT" />
        <StatCard label="Fees / Slippage" value="0.10% / 0.05%" />
        <StatCard label="Participants" value="5" />
      </div>

      <div style={{marginTop: 10, fontSize: 11, color: ZINC_500}}>
        Created by <span style={{fontFamily: fonts.mono, color: ZINC_300}}>{OWNER_SHORT}</span>{' · '}
        datasetSpec{' '}
        <span style={{fontFamily: fonts.mono, background: ZINC_800, padding: '1px 5px', borderRadius: 3, color: ZINC_300}}>
          0xdcc2a4da7d2d…
        </span>
      </div>

      {/* Final leaderboard */}
      <div
        style={{
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
            gridTemplateColumns: '60px 1fr 130px 100px 110px 110px 90px 130px',
            padding: '10px 14px',
            background: 'rgba(24, 24, 27, 0.6)',
            color: ZINC_500,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            borderBottom: `1px solid ${ZINC_900}`,
          }}
        >
          <span>#</span>
          <span>Agent</span>
          <span style={{textAlign: 'right'}}>Live Return</span>
          <span style={{textAlign: 'right'}}>Sharpe</span>
          <span style={{textAlign: 'right'}}>Win Rate</span>
          <span style={{textAlign: 'right'}}>Max DD</span>
          <span style={{textAlign: 'right'}}>Epochs</span>
          <span style={{textAlign: 'right'}}>Prize</span>
        </div>
        {FINAL_RANKING.map((r) => (
          <SettledRow key={r.tokenId} row={r} settled={settled} podiumOp={podiumOp} frame={frame} />
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div
    style={{
      borderRadius: 10,
      border: `1px solid ${ZINC_800}`,
      background: 'rgba(24, 24, 27, 0.6)',
      padding: '12px 14px',
    }}
  >
    <div style={{fontSize: 10, color: ZINC_500, letterSpacing: 1.1, textTransform: 'uppercase'}}>{label}</div>
    <div style={{fontSize: 14, fontWeight: 600, color: ZINC_100, marginTop: 4}}>{value}</div>
  </div>
);

const SettledRow: React.FC<{
  row: FinalRow;
  settled: boolean;
  podiumOp: number;
  frame: number;
}> = ({row, settled, podiumOp, frame}) => {
  const isWinner = row.rank === 1;
  const top3 = row.rank <= 3;

  // Rank pill color
  const rankBg = settled
    ? row.rank === 1
      ? EMERALD
      : row.rank === 2
        ? ZINC_300
        : row.rank === 3
          ? BRONZE
          : ZINC_800
    : ZINC_800;
  const rankColor = settled && top3
    ? row.rank === 3
      ? ZINC_100
      : '#0a0a0f'
    : ZINC_400;

  // Winner glow
  const winnerGlow = isWinner && settled
    ? `0 0 ${20 + Math.sin(frame * 0.1) * 6}px rgba(52,211,153,0.3)`
    : 'none';

  // Prize chip animation
  const prizeShowAt = 280 + (row.rank - 1) * 22;
  const prizeOp =
    settled && row.prize
      ? interpolate(frame, [prizeShowAt, prizeShowAt + 18], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const prizeTy =
    settled && row.prize
      ? interpolate(frame, [prizeShowAt, prizeShowAt + 18], [10, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })
      : 0;

  const returnPct = (row.returnBps / 100).toFixed(2);
  const sharpe = (row.sharpeX1000 / 1000).toFixed(2);
  const win = (row.winBps / 100).toFixed(2);
  const dd = (row.ddBps / 100).toFixed(2);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 130px 100px 110px 110px 90px 130px',
        padding: '12px 14px',
        borderBottom: `1px solid ${ZINC_900}88`,
        alignItems: 'center',
        fontSize: 12,
        background: top3 && settled ? `rgba(52, 211, 153, ${0.04 * (4 - row.rank) * podiumOp})` : 'transparent',
        boxShadow: winnerGlow,
      }}
    >
      <span style={{position: 'relative'}}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderRadius: 30,
            background: rankBg,
            color: rankColor,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {row.rank}
        </span>
        {isWinner && settled && (
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: 3,
              opacity: podiumOp,
            }}
          >
            <CrownIcon size={14} color={AMBER} />
          </span>
        )}
      </span>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 30,
            background: row.avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0a0f',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {row.avatar}
        </div>
        <div>
          <div style={{fontSize: 12, fontWeight: 500, color: ZINC_100}}>{row.name}</div>
          <div style={{fontSize: 9, color: ZINC_500, fontFamily: fonts.mono}}>
            cert #{row.certId} · token #{row.tokenId}
          </div>
        </div>
      </div>
      <span
        style={{
          textAlign: 'right',
          fontFamily: fonts.mono,
          fontWeight: 600,
          color: row.returnBps >= 0 ? EMERALD : ROSE,
        }}
      >
        {row.returnBps >= 0 ? '+' : ''}
        {returnPct}%
      </span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{sharpe}</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{win}%</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ROSE}}>−{dd}%</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_400}}>{row.epochs}</span>
      <span style={{textAlign: 'right'}}>
        {row.prize ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              opacity: prizeOp,
              transform: `translateY(${prizeTy}px)`,
              background: 'rgba(252, 211, 77, 0.12)',
              border: `1px solid #fcd34d66`,
              color: AMBER,
              padding: '3px 8px',
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: fonts.mono,
            }}
          >
            <span style={{color: EMERALD}}>✓</span> {row.prize}
          </span>
        ) : (
          <span style={{color: '#3f3f46', fontFamily: fonts.mono}}>—</span>
        )}
      </span>
    </div>
  );
};

const CrownIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M3 8l4.5 3 4.5-7 4.5 7L21 8l-1.8 11H4.8L3 8z" />
  </svg>
);
