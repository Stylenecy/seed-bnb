// ArenaLiveScene — 25 seconds, 750 frames @ 30fps.
//
// PLAN §4 storyboard #10: continues the /season/3 page from EnrollScene
// but now LIVE. Time-lapse 27min → 0 across ~22s. Per-token metrics
// drift toward their real Season #3 final values; rows re-sort by
// current liveReturnBps each frame; specific frames pulse an emerald
// flash on the row that just committed a new epoch. End with status
// flipping to "Awaiting settlement" for the Settle scene to pick up.
//
// Frame budget:
//   0–30     scene crossfades in (continuing browser)
//   30–680   live time-lapse: countdown 27:00 → 0:00, metrics drift,
//            epoch commits flash at 7 marquee frames, rows re-rank
//   680–720  countdown hits 0, status flips to "Awaiting settlement"
//   720–750  hold, caption "every epoch chain-committed · no one can fake the ranking"

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacBrowser} from '../components/MacBrowser';

// ─── tailwind→theme palette mapping ──────────────────────────────────────

const ZINC_900 = '#18181b';
const ZINC_800 = '#27272a';
const ZINC_500 = '#71717a';
const ZINC_400 = '#a1a1aa';
const ZINC_300 = '#d4d4d8';
const ZINC_100 = theme.text;
const EMERALD = theme.accent;
const ROSE = theme.negReturn;
const AMBER = '#fcd34d';

const OWNER_SHORT = '0xB1a5…0DbD';

// ─── token state (Season #3 perp final values) ──────────────────────────

interface Token {
  tokenId: number;
  certId: number;
  name: string;
  avatar: string;
  avatarBg: string;
  finalReturnBps: number;     // Season #3 final value
  finalSharpeX1000: number;
  finalDdBps: number;
  finalWinBps: number;
  finalEpochs: number;
  // Marquee commit frames — moments the row flashes + bumps significantly
  commitFrames: number[];
}

const TOKENS: Token[] = [
  {tokenId: 12, certId: 12, name: 'Perp Momentum 10x',      avatar: 'P', avatarBg: '#fbbf24', finalReturnBps: 14700, finalSharpeX1000: 2840,  finalDdBps: 1240, finalWinBps: 6800, finalEpochs: 11, commitFrames: [110, 280, 430, 580]},
  {tokenId: 8,  certId: 9,  name: 'Volatility Breakout 5x', avatar: 'V', avatarBg: '#0ea5e9', finalReturnBps: 6420,  finalSharpeX1000: 1980,  finalDdBps: 1850, finalWinBps: 5800, finalEpochs: 11, commitFrames: [80, 200, 340, 470, 610]},
  {tokenId: 11, certId: 11, name: 'Funding Rate Hunter',    avatar: 'F', avatarBg: '#a78bfa', finalReturnBps: 1890,  finalSharpeX1000: 1320,  finalDdBps: 980,  finalWinBps: 5400, finalEpochs: 11, commitFrames: [150, 390, 540]},
  {tokenId: 9,  certId: 10, name: 'Trend Follower 3x',      avatar: 'T', avatarBg: '#f59e0b', finalReturnBps: -3200, finalSharpeX1000: -890,  finalDdBps: 4100, finalWinBps: 4200, finalEpochs: 11, commitFrames: [180, 370, 520]},
  {tokenId: 10, certId: 13, name: 'Mean Revert Perp 5x',    avatar: 'M', avatarBg: '#ef4444', finalReturnBps: -6840, finalSharpeX1000: -2140, finalDdBps: 7200, finalWinBps: 3200, finalEpochs: 11, commitFrames: [240, 410, 550]},
];

// ─── per-token state at a given frame ────────────────────────────────────

interface LiveState {
  tokenId: number;
  returnBps: number;
  sharpeX1000: number;
  ddBps: number;
  winBps: number;
  epochs: number;
  flashIntensity: number; // 0..1 — how recently a commit fired
}

function computeLiveState(t: Token, frame: number): LiveState {
  // Smooth metric drift toward final value
  const driftEnd = 680; // metrics fully populated by this frame
  const driftProgress = Math.min(1, frame / driftEnd);
  const eased =
    driftProgress < 0.5
      ? 2 * driftProgress * driftProgress
      : 1 - Math.pow(-2 * driftProgress + 2, 2) / 2;

  // Add small per-token oscillation so it doesn't look linear-deterministic
  const wobble = Math.sin(frame * 0.06 + t.tokenId * 1.3) * (1 - eased) * 6;

  // Find the most recent commit frame
  let lastCommit = -1000;
  for (const c of t.commitFrames) {
    if (c <= frame && c > lastCommit) lastCommit = c;
  }
  const sinceCommit = frame - lastCommit;
  const flashIntensity = sinceCommit >= 0 && sinceCommit < 20
    ? 1 - sinceCommit / 20
    : 0;

  // Epoch count: incremented by 1 per commit frame already passed
  const commitsPassed = t.commitFrames.filter(c => frame >= c).length;
  const epochs = Math.floor((commitsPassed / t.commitFrames.length) * t.finalEpochs);

  return {
    tokenId: t.tokenId,
    returnBps: t.finalReturnBps * eased + wobble,
    sharpeX1000: t.finalSharpeX1000 * eased + wobble * 8,
    ddBps: t.finalDdBps * eased,
    winBps: t.finalWinBps * eased,
    epochs,
    flashIntensity,
  };
}

// ─── scene ────────────────────────────────────────────────────────────────

export const ArenaLiveScene: React.FC = () => {
  const frame = useCurrentFrame();

  const browserOp = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Countdown 27:00 → 0:00 across frames 0..680. Live status until 680, then "Awaiting settlement"
  const totalSec = 27 * 60;
  const elapsed = Math.min(680, frame);
  const remaining = Math.max(0, totalSec - Math.floor((elapsed / 680) * totalSec));
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const ended = frame >= 680;

  // Compute live state for every token
  const states = TOKENS.map(t => ({token: t, state: computeLiveState(t, frame)}));
  // Sort by returnBps descending
  const ranked = [...states].sort((a, b) => b.state.returnBps - a.state.returnBps);

  // Caption fade in
  const captionOp = interpolate(frame, [720, 745], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: browserOp}}>
        <MacBrowser url="zero-arena-fe.vercel.app/season/3" width={1620} height={920}>
          <SeasonLivePage
            ranked={ranked}
            mm={mm}
            ss={ss}
            ended={ended}
            frame={frame}
          />
        </MacBrowser>
      </div>

      {frame >= 720 && (
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
          every epoch chain-committed · no one can fake the ranking
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── season live page mirror ─────────────────────────────────────────────

const SeasonLivePage: React.FC<{
  ranked: {token: Token; state: LiveState}[];
  mm: number;
  ss: number;
  ended: boolean;
  frame: number;
}> = ({ranked, mm, ss, ended, frame}) => {
  // Status badge tone changes after 680
  const statusBg = ended ? 'rgba(245, 158, 11, 0.1)' : 'rgba(52, 211, 153, 0.1)';
  const statusBorder = ended ? '#f59e0b66' : `${EMERALD}66`;
  const statusColor = ended ? '#fbbf24' : EMERALD;
  const statusLabel = ended ? 'Awaiting settlement' : `Ends in ${mm}m ${String(ss).padStart(2, '0')}s`;

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
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                border: `1px solid ${statusBorder}`,
                background: statusBg,
                color: statusColor,
                padding: '4px 8px',
                borderRadius: 5,
                fontWeight: 600,
              }}
            >
              {!ended && <span style={{width: 6, height: 6, borderRadius: 6, background: EMERALD}} />}
              {statusLabel}
            </span>
            <span style={{color: ZINC_500}}>May 16, 2026 → May 16, 2026</span>
          </div>
        </div>

        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: 10, color: ZINC_500, letterSpacing: 1.2, textTransform: 'uppercase'}}>
            Prize Pool
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

      {/* Leaderboard table — live updating */}
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
            gridTemplateColumns: '50px 1fr 110px 130px 100px 110px 110px 90px',
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
          <span>Status</span>
          <span style={{textAlign: 'right'}}>Live Return</span>
          <span style={{textAlign: 'right'}}>Sharpe</span>
          <span style={{textAlign: 'right'}}>Win Rate</span>
          <span style={{textAlign: 'right'}}>Max DD</span>
          <span style={{textAlign: 'right'}}>Epochs</span>
        </div>
        {ranked.map(({token, state}, i) => (
          <LiveRow key={token.tokenId} token={token} state={state} rank={i + 1} ended={ended} frame={frame} />
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

// ─── live row ─────────────────────────────────────────────────────────────

const LiveRow: React.FC<{
  token: Token;
  state: LiveState;
  rank: number;
  ended: boolean;
  frame: number;
}> = ({token, state, rank, ended, frame}) => {
  const isFlashing = state.flashIntensity > 0;
  const flashBg = `rgba(52, 211, 153, ${state.flashIntensity * 0.12})`;

  const returnPct = (state.returnBps / 100).toFixed(2);
  const sharpe = (state.sharpeX1000 / 1000).toFixed(2);
  const win = (state.winBps / 100).toFixed(2);
  const dd = (state.ddBps / 100).toFixed(2);

  const rankBgs = ended
    ? rank === 1
      ? EMERALD
      : rank === 2
        ? ZINC_300
        : rank === 3
          ? '#b45309'
          : ZINC_800
    : ZINC_800;
  const rankColor = ended && rank <= 3
    ? rank === 3
      ? ZINC_100
      : '#0a0a0f'
    : ZINC_400;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 110px 130px 100px 110px 110px 90px',
        padding: '10px 14px',
        borderBottom: `1px solid ${ZINC_900}88`,
        alignItems: 'center',
        fontSize: 12,
        background: isFlashing ? flashBg : 'transparent',
        borderLeft: isFlashing ? `3px solid ${EMERALD}` : '3px solid transparent',
        boxShadow: isFlashing ? `inset 0 0 0 1px rgba(52,211,153,${state.flashIntensity * 0.4})` : 'none',
      }}
    >
      <span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 28,
            background: rankBgs,
            color: rankColor,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {rank}
        </span>
      </span>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 28,
            background: token.avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0a0f',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {token.avatar}
        </div>
        <div>
          <div style={{fontSize: 12, fontWeight: 500, color: ZINC_100}}>{token.name}</div>
          <div style={{fontSize: 9, color: ZINC_500, fontFamily: fonts.mono}}>
            cert #{token.certId} · token #{token.tokenId}
          </div>
        </div>
      </div>
      <span
        style={{
          color: ended ? ZINC_400 : EMERALD,
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {!ended && <span style={{width: 5, height: 5, borderRadius: 5, background: EMERALD}} />}
        {ended ? 'Stopped' : 'Live'}
      </span>
      <span
        style={{
          textAlign: 'right',
          fontFamily: fonts.mono,
          fontWeight: 600,
          color: state.returnBps >= 0 ? EMERALD : ROSE,
        }}
      >
        {state.returnBps >= 0 ? '+' : ''}
        {returnPct}%
      </span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{sharpe}</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_300}}>{win}%</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ROSE}}>−{dd}%</span>
      <span style={{textAlign: 'right', fontFamily: fonts.mono, color: ZINC_400, position: 'relative'}}>
        {state.epochs}
        {isFlashing && (
          <span
            style={{
              position: 'absolute',
              right: -2,
              top: -8,
              color: EMERALD,
              fontSize: 9,
              fontWeight: 700,
              opacity: state.flashIntensity,
            }}
          >
            +1
          </span>
        )}
      </span>
    </div>
  );
};
