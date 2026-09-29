// FrontendScene — 20 seconds, 600 frames @ 30fps.
//
// Mirrors zero-arena-fe's /leaderboard + /agent/[slug] page LAYOUTS exactly
// (structure, spacing, columns, panels). Color palette stays our emerald
// accent — the FE will be updated to match later. Real Season #2 data,
// real Wallet A owner, real token #1 (RSI Classic) for the detail view.

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacBrowser} from '../components/MacBrowser';

// ─── data ─────────────────────────────────────────────────────────────────

interface Row {
  rank: number;
  tokenId: number;
  certId: number;
  name: string;
  strategy: string;
  market: string;
  returnBps: number;
  sharpeX1000: number;
  winRateBps: number;
  drawdownBps: number;
  mints: number;
  trustTier: 'T2';
  avatar: string;
  avatarBg: string;
}

const ROWS: Row[] = [
  {rank: 1, tokenId: 12, certId: 12, name: 'Perp Momentum 10x',      strategy: 'Rule-based', market: 'Perp · 10×', returnBps: 14700, sharpeX1000: 2840,  winRateBps: 6800, drawdownBps: 1240, mints: 4, trustTier: 'T2', avatar: 'P', avatarBg: '#fbbf24'},
  {rank: 2, tokenId: 8,  certId: 9,  name: 'Volatility Breakout 5x', strategy: 'Rule-based', market: 'Perp · 5×',  returnBps: 6420,  sharpeX1000: 1980,  winRateBps: 5800, drawdownBps: 1850, mints: 2, trustTier: 'T2', avatar: 'V', avatarBg: '#0ea5e9'},
  {rank: 3, tokenId: 11, certId: 11, name: 'Funding Rate Hunter',    strategy: 'Rule-based', market: 'Perp · 2×',  returnBps: 1890,  sharpeX1000: 1320,  winRateBps: 5400, drawdownBps: 980,  mints: 2, trustTier: 'T2', avatar: 'F', avatarBg: '#a78bfa'},
  {rank: 4, tokenId: 9,  certId: 10, name: 'Trend Follower 3x',      strategy: 'Rule-based', market: 'Perp · 3×',  returnBps: -3200, sharpeX1000: -890,  winRateBps: 4200, drawdownBps: 4100, mints: 1, trustTier: 'T2', avatar: 'T', avatarBg: '#f59e0b'},
  {rank: 5, tokenId: 10, certId: 13, name: 'Mean Revert Perp 5x',    strategy: 'Rule-based', market: 'Perp · 5×',  returnBps: -6840, sharpeX1000: -2140, winRateBps: 3200, drawdownBps: 7200, mints: 1, trustTier: 'T2', avatar: 'M', avatarBg: '#ef4444'},
];

const HIGHLIGHTED_RANK = 1; // Perp Momentum 10x — the winner, what we click into

const OWNER_SHORT = '0xB1a5…0DbD';

// FE Tailwind palette → video theme mapping
const ZINC_900 = '#18181b';
const ZINC_800 = '#27272a';
const ZINC_500 = '#71717a';
const ZINC_400 = '#a1a1aa';
const ZINC_300 = '#d4d4d8';
const ZINC_100 = theme.text;
const EMERALD = theme.accent;
const ROSE = theme.negReturn;

// ─── scene ────────────────────────────────────────────────────────────────

export const FrontendScene: React.FC = () => {
  const frame = useCurrentFrame();

  const browserOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const browserY = interpolate(frame, [0, 30], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const phase: 'leaderboard' | 'agent' = frame < 240 ? 'leaderboard' : 'agent';
  const url =
    phase === 'leaderboard'
      ? 'zero-arena-fe.vercel.app/leaderboard'
      : 'zero-arena-fe.vercel.app/agent/cert-12';

  const cursor = computeCursorPath(frame);

  const ripple = frame >= 215 && frame < 235;
  const rippleScale = interpolate(frame, [215, 235], [0, 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const rippleOpacity = interpolate(frame, [215, 235], [0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leaderboardOp = interpolate(frame, [230, 240], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const agentOp = interpolate(frame, [240, 270], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const captionOp = interpolate(frame, [540, 570], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{transform: `translateY(${browserY}px)`, opacity: browserOpacity, position: 'relative'}}>
        <MacBrowser url={url} width={1680} height={920}>
          {phase === 'leaderboard' ? (
            <div style={{opacity: leaderboardOp}}>
              <LeaderboardPage frame={frame} />
            </div>
          ) : (
            <div style={{opacity: agentOp}}>
              <AgentDetailPage frame={frame} />
            </div>
          )}
        </MacBrowser>

        <Cursor x={cursor.x} y={cursor.y} />

        {ripple && (
          <div
            style={{
              position: 'absolute',
              left: cursor.x - 12,
              top: cursor.y - 12,
              width: 24,
              height: 24,
              borderRadius: 24,
              background: EMERALD,
              opacity: rippleOpacity,
              transform: `scale(${rippleScale})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {frame >= 540 && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontFamily: fonts.mono,
            fontSize: 18,
            color: theme.textMuted,
            opacity: captionOp,
            letterSpacing: 0.5,
          }}
        >
          <span style={{color: theme.textDim}}>// </span>
          every minted agent surfaces here · trust badges · operator-attested badges
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── cursor path ──────────────────────────────────────────────────────────

function computeCursorPath(frame: number): {x: number; y: number} {
  const W = 1920;
  const browserLeft = (W - 1680) / 2;
  const startX = browserLeft + 220;
  const startY = 220;
  // Perp Momentum 10x row in the table — first row (after header + filters + podium)
  const rowX = browserLeft + 380;
  const rowY = 580;
  // After click → cursor parks at agent detail "Mint iNFT" button area
  const detailX = browserLeft + 1450;
  const detailY = 360;

  if (frame < 100) {
    return {
      x: startX + Math.sin(frame * 0.08) * 4,
      y: startY + Math.cos(frame * 0.06) * 3,
    };
  }
  if (frame < 200) {
    const t = (frame - 100) / 100;
    const eased = easeInOutCubic(t);
    return {
      x: startX + (rowX - startX) * eased,
      y: startY + (rowY - startY) * eased,
    };
  }
  if (frame < 240) {
    return {x: rowX + Math.sin(frame * 0.3) * 2, y: rowY};
  }
  if (frame < 360) {
    const t = (frame - 240) / 120;
    const eased = easeInOutCubic(t);
    return {
      x: rowX + (detailX - rowX) * eased,
      y: rowY + (detailY - rowY) * eased,
    };
  }
  return {x: detailX + Math.sin(frame * 0.05) * 3, y: detailY};
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── leaderboard page (mirrors FE /leaderboard/page.tsx exactly) ─────────

const LeaderboardPage: React.FC<{frame: number}> = ({frame}) => {
  const headerOp = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{fontFamily: fonts.sans, color: ZINC_100, padding: '20px 24px 8px'}}>
      {/* Breadcrumb */}
      <div style={{opacity: headerOp, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ZINC_500}}>
        <span style={{cursor: 'pointer'}}>Agents</span>
        <span>/</span>
        <span style={{color: ZINC_300}}>Leaderboard</span>
      </div>

      {/* Title row */}
      <div style={{opacity: headerOp, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 16}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <CrownIcon size={24} color={EMERALD} />
            <span style={{fontSize: 24, fontWeight: 700, letterSpacing: -0.6}}>Top Verified Agents</span>
          </div>
          <div style={{marginTop: 4, fontSize: 13, color: ZINC_500, maxWidth: 580}}>
            Ranking AI trading agents by metrics committed on-chain. Each row is a{' '}
            <code style={{fontFamily: fonts.mono, color: ZINC_400}}>Certificate</code> tuple anchored to
            0G Aristotle mainnet.
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: `1px solid ${EMERALD}66`,
              background: 'rgba(52, 211, 153, 0.1)',
              color: EMERALD,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 12,
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
          {(['All Tiers', 'T1', 'T2', 'T3'] as const).map((t, i) => {
            const active = i === 0;
            return (
              <span
                key={t}
                style={{
                  border: `1px solid ${active ? EMERALD : ZINC_800}`,
                  background: active ? EMERALD : ZINC_900,
                  color: active ? '#0a0a0f' : ZINC_300,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            );
          })}
        </div>
      </div>

      {/* Market tabs */}
      <div
        style={{
          opacity: headerOp,
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          borderBottom: `1px solid ${ZINC_900}`,
          fontSize: 14,
          paddingBottom: 12,
        }}
      >
        {(['All', 'Spot', 'Futures'] as const).map((t, i) => {
          const active = i === 2; // Futures tab active — leaderboard sorted by perp ROI
          return (
            <span
              key={t}
              style={{
                position: 'relative',
                fontWeight: active ? 600 : 400,
                color: active ? ZINC_100 : ZINC_400,
              }}
            >
              {t}
              <span style={{marginLeft: 6, fontSize: 12, color: ZINC_500}}>
                {t === 'All' ? 11 : t === 'Spot' ? 6 : 5}
              </span>
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -13,
                    height: 2,
                    background: EMERALD,
                    borderRadius: 2,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>

      {/* Sort row */}
      <div style={{opacity: headerOp, marginTop: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8}}>
        <span style={{fontSize: 12, color: ZINC_500}}>Sort by:</span>
        {['Total Return', 'Sharpe', 'Win Rate', 'Min Drawdown', 'Most Minted'].map((m, i) => {
          const active = i === 0;
          return (
            <span
              key={m}
              style={{
                border: `1px solid ${active ? 'transparent' : ZINC_800}`,
                background: active ? EMERALD : ZINC_900,
                color: active ? '#0a0a0f' : ZINC_300,
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {m}
            </span>
          );
        })}
      </div>

      {/* Podium — order: #2 (left, h-360) · #1 (center, h-400) · #3 (right, h-340) */}
      <div style={{marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'flex-end'}}>
        <PodiumCard row={ROWS[1]!} rank={2} height={300} accent={{ring: '#d4d4d8', chip: ZINC_300}} frame={frame} showAt={70} />
        <PodiumCard row={ROWS[0]!} rank={1} height={340} accent={{ring: EMERALD, chip: EMERALD}} frame={frame} showAt={60} winner />
        <PodiumCard row={ROWS[2]!} rank={3} height={280} accent={{ring: '#b45309', chip: '#b45309'}} frame={frame} showAt={80} />
      </div>

      {/* Full ranking heading */}
      <div style={{marginTop: 28, marginBottom: 10, fontSize: 13, fontWeight: 600, color: ZINC_300}}>
        Full ranking
      </div>

      {/* Table */}
      <FullRankingTable frame={frame} />
    </div>
  );
};

const PodiumCard: React.FC<{
  row: Row;
  rank: 1 | 2 | 3;
  height: number;
  accent: {ring: string; chip: string};
  frame: number;
  showAt: number;
  winner?: boolean;
}> = ({row, rank, height, accent, frame, showAt, winner}) => {
  const op = interpolate(frame, [showAt, showAt + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(frame, [showAt, showAt + 24], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: 'relative',
        opacity: op,
        transform: `translateY(${ty}px)`,
        height,
        background: 'rgba(24, 24, 27, 0.6)',
        border: `1px solid ${ZINC_800}cc`,
        borderRadius: 16,
        padding: '18px 18px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Rank chip floating */}
      <span
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: accent.chip,
          color: rank === 3 ? '#fafafa' : '#0a0a0f',
          padding: '2px 12px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {winner ? <CrownIcon size={13} color="#0a0a0f" /> : <MedalIcon size={13} color={rank === 3 ? '#fafafa' : '#0a0a0f'} />}
        #{rank}
      </span>

      {/* Avatar */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 60,
          background: row.avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0a0a0f',
          fontSize: 26,
          fontWeight: 700,
          boxShadow: `0 0 0 2px ${accent.ring}`,
        }}
      >
        {row.avatar}
      </div>

      {/* Name + badges */}
      <div style={{marginTop: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6}}>
        <span style={{fontSize: 13, fontWeight: 600, color: ZINC_100}}>{row.name}</span>
        <TierBadge tier="T2" />
        <OperatorBadge />
      </div>
      <div style={{fontSize: 11, color: ZINC_500, marginTop: 2}}>
        by <span style={{fontFamily: fonts.mono}}>{OWNER_SHORT}</span>
      </div>
      <div style={{fontSize: 10, color: ZINC_500, marginTop: 2}}>{row.market}</div>

      {/* 30D Total Return label */}
      <div
        style={{
          marginTop: 12,
          fontSize: 10,
          color: ZINC_500,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        30D Total Return
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 22,
          fontWeight: 700,
          color: row.returnBps >= 0 ? EMERALD : ROSE,
        }}
      >
        {row.returnBps >= 0 ? '+' : ''}
        {(row.returnBps / 100).toFixed(2)}%
      </div>

      {/* 3-col mini grid */}
      <div
        style={{
          marginTop: 10,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          borderTop: `1px solid ${ZINC_800}`,
          paddingTop: 8,
          textAlign: 'center',
          fontSize: 10,
        }}
      >
        <div>
          <div style={{color: ZINC_500}}>Return</div>
          <div style={{fontFamily: fonts.mono, color: row.returnBps >= 0 ? EMERALD : ROSE}}>
            {row.returnBps >= 0 ? '+' : ''}
            {(row.returnBps / 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{color: ZINC_500}}>Win</div>
          <div style={{fontFamily: fonts.mono, color: ZINC_300}}>
            {(row.winRateBps / 100).toFixed(0)}%
          </div>
        </div>
        <div>
          <div style={{color: ZINC_500}}>Sharpe</div>
          <div style={{fontFamily: fonts.mono, color: ZINC_300}}>
            {(row.sharpeX1000 / 1000).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bottom accent strip */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          background: accent.chip,
        }}
      />
    </div>
  );
};

const FullRankingTable: React.FC<{frame: number}> = ({frame}) => {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${ZINC_800}cc`,
        background: 'rgba(24, 24, 27, 0.4)',
        overflow: 'hidden',
      }}
    >
      {/* head */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px 1fr 130px 200px 130px 110px 110px 130px 110px 110px',
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
        <span>Market</span>
        <span>Tier</span>
        <span style={{textAlign: 'right', color: EMERALD}}>Total Return</span>
        <span style={{textAlign: 'right'}}>Sharpe</span>
        <span style={{textAlign: 'right'}}>Win Rate</span>
        <span style={{textAlign: 'right'}}>Min DD</span>
        <span style={{textAlign: 'right'}}>Mints</span>
        <span style={{textAlign: 'right'}}>Action</span>
      </div>
      {ROWS.map((r, i) => (
        <TableRow key={r.tokenId} row={r} index={i} frame={frame} />
      ))}
    </div>
  );
};

const TableRow: React.FC<{row: Row; index: number; frame: number}> = ({row, index, frame}) => {
  const showAt = 110 + index * 6;
  const op = interpolate(frame, [showAt, showAt + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isHl = row.rank === HIGHLIGHTED_RANK;
  const hoverAlpha = isHl
    ? interpolate(frame, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  const returnPct = (row.returnBps / 100).toFixed(2);
  const sharpe = (row.sharpeX1000 / 1000).toFixed(2);
  const win = (row.winRateBps / 100).toFixed(2);
  const dd = (row.drawdownBps / 100).toFixed(2);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr 130px 200px 130px 110px 110px 130px 110px 110px',
        padding: '10px 14px',
        borderBottom: `1px solid ${ZINC_900}88`,
        alignItems: 'center',
        opacity: op,
        background: hoverAlpha > 0 ? `rgba(52, 211, 153, ${hoverAlpha * 0.1})` : 'transparent',
        fontSize: 13,
      }}
    >
      <span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 26,
            background:
              row.rank === 1 ? EMERALD : row.rank === 2 ? ZINC_300 : row.rank === 3 ? '#b45309' : ZINC_800,
            color: row.rank <= 3 && row.rank !== 3 ? '#0a0a0f' : row.rank === 3 ? '#fafafa' : ZINC_400,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {row.rank}
        </span>
      </span>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 32,
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
          <div style={{fontSize: 13, fontWeight: 500, color: ZINC_100}}>{row.name}</div>
          <div style={{fontSize: 10, color: ZINC_500}}>
            <span style={{fontFamily: fonts.mono}}>{OWNER_SHORT}</span>
            <span style={{margin: '0 4px'}}>·</span>
            {row.strategy}
          </div>
        </div>
      </div>
      <span style={{color: ZINC_300, fontSize: 11}}>{row.market}</span>
      <div style={{display: 'flex', gap: 4}}>
        <TierBadge tier={row.trustTier} />
        <OperatorBadge />
      </div>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: row.returnBps >= 0 ? EMERALD : ROSE, fontWeight: 600}}>
        {row.returnBps >= 0 ? '+' : ''}
        {returnPct}%
      </span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{sharpe}</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{win}%</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ROSE}}>−{dd}%</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{row.mints}</span>
      <span style={{textAlign: 'right'}}>
        <span
          style={{
            border: `1px solid ${ZINC_800}`,
            background: ZINC_900,
            color: ZINC_300,
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 10,
          }}
        >
          Inspect
        </span>
      </span>
    </div>
  );
};

// ─── agent detail page (mirrors FE /agent/[slug]/page.tsx) ───────────────

const AgentDetailPage: React.FC<{frame: number}> = ({frame}) => {
  const headerOp = interpolate(frame, [255, 285], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const heroOp = interpolate(frame, [285, 320], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const perfOp = interpolate(frame, [340, 380], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const certOp = interpolate(frame, [410, 450], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scrollY = interpolate(frame, [430, 540], [0, 110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <div style={{transform: `translateY(${-scrollY}px)`, fontFamily: fonts.sans, color: ZINC_100, padding: '20px 24px 8px'}}>
      {/* Back link */}
      <div style={{opacity: headerOp, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: ZINC_400}}>
        <span style={{fontSize: 16}}>‹</span>
        Agent Registry
      </div>

      {/* Top row: chips + action buttons */}
      <div
        style={{
          opacity: headerOp,
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
          <Chip>Perp · 10× lev</Chip>
          <Chip>Rule-based</Chip>
          <TrustTierCard tier="T2" />
          <OperatorBadge size="md" />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: `1px solid ${ZINC_800}`,
              background: ZINC_900,
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 11,
              color: ZINC_300,
            }}
          >
            <ShieldIcon size={12} color={EMERALD} />4 mints
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: `1px solid ${ZINC_800}`,
              background: ZINC_900,
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 11,
              color: ZINC_300,
            }}
          >
            ⤴ 0G Explorer
          </span>
        </div>
      </div>

      {/* Hero row: avatar + name + desc + action stack */}
      <div
        style={{
          opacity: heroOp,
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 28,
        }}
      >
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 16}}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 52,
              background: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0a0f',
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            P
          </div>
          <div style={{maxWidth: 720}}>
            <div style={{fontSize: 22, fontWeight: 600, color: ZINC_100}}>Perp Momentum 10x</div>
            <div style={{fontSize: 11, color: ZINC_500, marginTop: 2}}>
              Author{' '}
              <span style={{fontFamily: fonts.mono, color: ZINC_300}}>{OWNER_SHORT}</span>
            </div>
            <p style={{fontSize: 13, color: ZINC_400, lineHeight: 1.5, marginTop: 10}}>
              High-leverage perp momentum trader on BTC/USDT 15m candles. 10× isolated leverage.
              Position size scaled by ATR. Hard SL at −8%, trailing TP from +25%.
            </p>
            <p style={{fontSize: 10, fontStyle: 'italic', color: ZINC_500, marginTop: 10}}>
              T2 · Reproducible by anyone the owner authorizes (encrypted run log + shared AES key).
            </p>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, width: 170, flexShrink: 0}}>
          <button
            style={{
              background: EMERALD,
              color: '#0a0a0f',
              padding: '8px 0',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
            }}
          >
            Mint iNFT
          </button>
          <button
            style={{
              background: ZINC_900,
              color: ZINC_300,
              padding: '8px 0',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${ZINC_800}`,
            }}
          >
            Clone &amp; Re-run
          </button>
          <button
            style={{
              background: ZINC_900,
              color: ZINC_300,
              padding: '8px 0',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${ZINC_800}`,
            }}
          >
            Verify Run
          </button>
        </div>
      </div>

      {/* Performance + Chart row */}
      <div
        style={{
          opacity: perfOp,
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 16,
        }}
      >
        {/* Performance sidebar */}
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${ZINC_800}cc`,
            background: 'rgba(24, 24, 27, 0.6)',
            padding: '18px',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{fontSize: 13, fontWeight: 600, color: ZINC_100}}>Performance</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: ZINC_400}}>
              30 Days <span style={{fontSize: 8}}>▼</span>
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14}}>
            <div>
              <div style={{fontSize: 10, color: ZINC_500}}>Total Return</div>
              <div style={{fontSize: 15, fontWeight: 600, color: EMERALD, fontFamily: fonts.mono, marginTop: 2}}>
                +147.00%
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: 10, color: ZINC_500}}>Sharpe</div>
              <div style={{fontSize: 15, fontWeight: 600, color: ZINC_100, fontFamily: fonts.mono, marginTop: 2}}>
                2.84
              </div>
            </div>
          </div>
          <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
            <StatRow label="Max Drawdown" value="−12.40%" valueColor={ROSE} />
            <StatRow label="Win Rate" value="68.0%" />
            <StatRow label="Win Positions" value="78" />
            <StatRow label="Total Positions" value="117" />
            <StatRow label="Liquidations" value="3" valueColor={ROSE} />
          </div>
        </div>

        {/* Chart panel */}
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${ZINC_800}cc`,
            background: 'rgba(24, 24, 27, 0.6)',
            padding: '18px',
          }}
        >
          <div style={{height: 240, position: 'relative'}}>
            <ChartMock />
          </div>
        </div>
      </div>

      {/* Certificate + Backtest config row */}
      <div
        style={{
          opacity: certOp,
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${ZINC_800}cc`,
            background: 'rgba(24, 24, 27, 0.6)',
            padding: '18px',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{fontSize: 13, fontWeight: 600, color: ZINC_100}}>Certificate</span>
            <span style={{fontFamily: fonts.mono, fontSize: 11, color: ZINC_400}}>#1</span>
          </div>
          <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8}}>
            <StatRow label="Trust Tier" value="T2 · Reproducible" valueColor="#93c5fd" />
            <HashRow label="runHash" value="0xc2200699d648787d…d25984cf486e98" />
            <HashRow label="datasetHash" value="0xef045d37191201052a…b573972361" />
            <HashRow label="storageRootHash" value="0xcf47acaaf6f27a0a…ae46d2e2aaa0" />
            <StatRow label="attestationHash" value="— (T3 only)" valueColor={ZINC_500} />
            <StatRow label="Submitted" value="2026-05-14T08:42:11Z" />
            <StatRow label="Owner" value={OWNER_SHORT} mono />
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${ZINC_800}cc`,
            background: 'rgba(24, 24, 27, 0.6)',
            padding: '18px',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{fontSize: 13, fontWeight: 600, color: ZINC_100}}>Backtest Configuration</span>
            <span style={{fontSize: 11, color: ZINC_500}}>deterministic</span>
          </div>
          <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8}}>
            <StatRow label="Market" value="Futures (perpetual)" />
            <StatRow label="Asset" value="BTC/USDT" />
            <StatRow label="Leverage" value="10× isolated" valueColor="#fcd34d" />
            <StatRow label="Initial Balance" value="$10,000 USDT" />
            <StatRow label="Taker Fee" value="0.05%" />
            <StatRow label="Slippage" value="0.05%" />
            <StatRow label="Granularity" value="15m" />
            <StatRow label="Window" value="365d" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── small components ────────────────────────────────────────────────────

const StatRow: React.FC<{label: string; value: string; valueColor?: string; mono?: boolean}> = ({
  label,
  value,
  valueColor = ZINC_300,
  mono,
}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11}}>
    <span style={{color: ZINC_500}}>{label}</span>
    <span style={{color: valueColor, fontFamily: mono ? fonts.mono : fonts.sans, fontWeight: 500}}>
      {value}
    </span>
  </div>
);

const HashRow: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, gap: 12}}>
    <span style={{color: ZINC_500, flexShrink: 0}}>{label}</span>
    <span style={{color: ZINC_300, fontFamily: fonts.mono, fontSize: 11, textAlign: 'right'}}>{value}</span>
  </div>
);

const Chip: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span
    style={{
      background: ZINC_800,
      color: ZINC_300,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
    }}
  >
    {children}
  </span>
);

const TrustTierCard: React.FC<{tier: 'T1' | 'T2' | 'T3'}> = ({tier}) => {
  const tone =
    tier === 'T3'
      ? {bg: 'rgba(52, 211, 153, 0.12)', color: EMERALD, ring: `${EMERALD}66`}
      : tier === 'T2'
        ? {bg: 'rgba(96, 165, 250, 0.12)', color: '#93c5fd', ring: '#60a5fa66'}
        : {bg: 'rgba(154, 154, 168, 0.10)', color: ZINC_400, ring: ZINC_800};
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${tone.ring}`,
        background: tone.bg,
        color: tone.color,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <ShieldIcon size={11} color={tone.color} />
      {tier} · {tier === 'T1' ? 'Committed' : tier === 'T2' ? 'Reproducible' : 'TEE'}
    </span>
  );
};

const TierBadge: React.FC<{tier: 'T1' | 'T2' | 'T3'}> = ({tier}) => {
  const tone =
    tier === 'T3'
      ? {bg: 'rgba(52, 211, 153, 0.12)', color: EMERALD, ring: `${EMERALD}66`}
      : tier === 'T2'
        ? {bg: 'rgba(96, 165, 250, 0.12)', color: '#93c5fd', ring: '#60a5fa66'}
        : {bg: 'rgba(154, 154, 168, 0.10)', color: ZINC_400, ring: ZINC_800};
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.ring}`,
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 500,
      }}
    >
      <ShieldIcon size={9} color={tone.color} />
      {tier}
    </span>
  );
};

const OperatorBadge: React.FC<{size?: 'sm' | 'md'}> = ({size = 'sm'}) => {
  const padding = size === 'md' ? '3px 10px' : '1px 6px';
  const fs = size === 'md' ? 11 : 9;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(52, 211, 153, 0.15)',
        color: EMERALD,
        border: `1px solid ${EMERALD}66`,
        padding,
        borderRadius: size === 'md' ? 999 : 4,
        fontSize: fs,
        fontWeight: 500,
      }}
    >
      Operator: Zero Arena
    </span>
  );
};

// ─── icons ───────────────────────────────────────────────────────────────

const CrownIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M3 8l4.5 3 4.5-7 4.5 7L21 8l-1.8 11H4.8L3 8z" />
  </svg>
);

const MedalIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 14a4 4 0 100-8 4 4 0 000 8zm-4 1.6L6.4 21l3.6-1.5L12 21l2-1.5 3.6 1.5L16 15.6A6 6 0 018 15.6z" />
  </svg>
);

const ShieldIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <path d="M8 1l6 2v5.2c0 3-2.5 5.7-6 6.8-3.5-1.1-6-3.8-6-6.8V3l6-2zm-.7 9.5l4-4-1-1-3 3-1.3-1.3-1 1L7.3 10.5z" />
  </svg>
);

// Simple line chart mock (positive trend)
const ChartMock: React.FC = () => {
  const points: Array<[number, number]> = [
    [0, 200], [60, 195], [120, 190], [180, 185], [240, 178], [300, 175], [360, 170],
    [420, 168], [480, 160], [540, 158], [600, 152], [660, 148], [720, 142], [780, 138],
    [840, 135], [900, 130], [960, 125], [1020, 122], [1080, 118], [1140, 115], [1200, 110],
  ];
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const areaD = pathD + ` L 1200 240 L 0 240 Z`;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1200 240" preserveAspectRatio="none">
      {/* baseline */}
      <line x1="0" y1="200" x2="1200" y2="200" stroke={ZINC_800} strokeWidth="1" strokeDasharray="4 6" />
      {/* area fill */}
      <path d={areaD} fill="rgba(52, 211, 153, 0.08)" />
      {/* line */}
      <path d={pathD} fill="none" stroke={EMERALD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Cursor: React.FC<{x: number; y: number}> = ({x, y}) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
    }}
  >
    <circle cx="11" cy="11" r="7" fill={ZINC_100} />
    <circle cx="11" cy="11" r="7.5" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
  </svg>
);
