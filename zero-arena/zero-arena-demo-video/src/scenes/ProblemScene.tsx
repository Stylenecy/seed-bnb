// ProblemScene — 7 seconds, 210 frames @ 30fps.
//
// PLAN §4 storyboard #2. After Hook's "TradeMax AI"/UNVERIFIED reveal,
// this scene names the three structural problems AI-trading agents face.
//
// Tone: cold and clinical. Three rows fade in stacked. Each row is a
// labeled failure mode with a one-liner explanation and a "✗" mark.
// A subtle terminal-style header sets the framing: `// the three failure modes`.
//
// Frame budget:
//   0–24     header fades in + thin separator line draws
//   24–80    row 1 (Strategy theft)
//   80–130   row 2 (Backtest cherry-picking)
//   130–180  row 3 (No live track-record)
//   180–210  trailing caption "// what's missing: cryptographic proof"

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';

type Row = {
  index: number;
  showAt: number;
  badge: string;
  title: string;
  detail: string;
  example: string;
};

const ROWS: Row[] = [
  {
    index: 1,
    showAt: 24,
    badge: '01',
    title: 'Open-source = strategy theft.',
    detail: 'Publish the code to prove anything and any competitor forks the alpha overnight.',
    example: '$ git clone your-edge.git   # done.',
  },
  {
    index: 2,
    showAt: 80,
    badge: '02',
    title: 'Backtests are cherry-picked.',
    detail: 'A screenshot of +200% has no public dataset, no run log, no way to rerun.',
    example: 'sharpe: 3.7  ·  unverifiable  ·  trust me bro',
  },
  {
    index: 3,
    showAt: 130,
    badge: '03',
    title: 'No live track-record.',
    detail: 'Past returns on private servers ≠ a public, append-only record of live decisions.',
    example: 'live PnL: ████████  (off-chain, mutable, gated)',
  },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Header fade
  const headerOp = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 24], [-8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Separator line draw — left-to-right.
  const sepWidth = interpolate(frame, [6, 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Trailing caption
  const captionOp = interpolate(frame, [180, 200], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, padding: '120px 160px', justifyContent: 'flex-start'}}>
      {/* Subtle grid backdrop — barely visible */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          opacity: 0.05,
        }}
      />

      {/* Header strip */}
      <div style={{opacity: headerOp, transform: `translateY(${headerY}px)`, marginBottom: 24}}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 18,
            color: theme.textMuted,
            letterSpacing: 0.5,
          }}
        >
          <span style={{color: theme.textDim}}>// </span>
          the three failure modes of today&apos;s AI trading agents
        </div>
        <div style={{marginTop: 24, height: 1, background: theme.border, width: `${sepWidth * 100}%`}} />
      </div>

      {/* Three failure-mode rows */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 32, marginTop: 24}}>
        {ROWS.map((row) => (
          <FailureRow key={row.index} row={row} frame={frame} />
        ))}
      </div>

      {/* Trailing caption */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 160,
          right: 160,
          opacity: captionOp,
          fontFamily: fonts.mono,
          fontSize: 20,
          color: theme.textMuted,
          letterSpacing: 0.5,
        }}
      >
        <span style={{color: theme.textDim}}>// </span>
        what&apos;s missing:{' '}
        <span style={{color: theme.accent, fontWeight: 600}}>cryptographic proof of honesty</span>
      </div>
    </AbsoluteFill>
  );
};

const FailureRow: React.FC<{row: Row; frame: number}> = ({row, frame}) => {
  const {showAt} = row;
  const op = interpolate(frame, [showAt, showAt + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(frame, [showAt, showAt + 24], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // X-mark draws after row arrives.
  const xProgress = interpolate(frame, [showAt + 12, showAt + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity: op,
        transform: `translateY(${ty}px)`,
        display: 'grid',
        gridTemplateColumns: '64px 1fr auto',
        gap: 28,
        alignItems: 'flex-start',
      }}
    >
      {/* Badge */}
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 38,
          fontWeight: 700,
          color: theme.textDim,
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {row.badge}
      </div>

      {/* Title + detail + mono example */}
      <div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 34,
            fontWeight: 600,
            color: theme.text,
            letterSpacing: -0.4,
            lineHeight: 1.2,
          }}
        >
          {row.title}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.sans,
            fontSize: 19,
            color: theme.textMuted,
            lineHeight: 1.55,
            maxWidth: 880,
          }}
        >
          {row.detail}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: fonts.mono,
            fontSize: 15,
            color: theme.textDim,
            background: theme.bgPanel,
            border: `1px solid ${theme.borderSoft}`,
            borderRadius: 6,
            padding: '8px 12px',
            display: 'inline-block',
          }}
        >
          {row.example}
        </div>
      </div>

      {/* X-mark — drawn as two SVG strokes */}
      <div style={{width: 56, height: 56, marginTop: 8}}>
        <svg viewBox="0 0 56 56" width="56" height="56">
          <circle cx="28" cy="28" r="26" fill="none" stroke={theme.border} strokeWidth="1.5" />
          <line
            x1="18"
            y1="18"
            x2={18 + xProgress * 20}
            y2={18 + xProgress * 20}
            stroke={theme.negReturn}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1="18"
            x2={38 - xProgress * 20}
            y2={18 + xProgress * 20}
            stroke={theme.negReturn}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
