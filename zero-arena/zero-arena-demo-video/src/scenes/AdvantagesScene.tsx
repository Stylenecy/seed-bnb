// AdvantagesScene — 4 seconds, 120 frames @ 30fps.
//
// PLAN §4 storyboard #13. Tight 4-bullet recap right before Closing.
// Each bullet flashes a ✓ check + short claim. No long sentences.
// Pacing: ~24 frames per bullet, leaving ~24 frames for final hold.
//
// Frame budget:
//   0–18     header types in
//   18–42    bullet 1
//   42–66    bullet 2
//   66–90    bullet 3
//   90–114   bullet 4
//   114–120  hold

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';

type Bullet = {
  showAt: number;
  text: string;
  detail: string;
};

const BULLETS: Bullet[] = [
  {showAt: 18, text: 'Strategy stays private.', detail: 'AES-256-GCM at rest · ECIES in transit.'},
  {showAt: 42, text: 'Backtests are reproducible.', detail: 'Same dataset · same agent → same runHash.'},
  {showAt: 66, text: 'Live track-record is public.', detail: 'Hash-chained EpochCommitted on 0G Aristotle.'},
  {showAt: 90, text: 'No SaaS lock-in.', detail: 'Open SDK · open contracts · owner-operated by default.'},
];

export const AdvantagesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 18], [-8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        padding: '100px 140px',
        justifyContent: 'center',
      }}
    >
      {/* Subtle grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          opacity: 0.05,
        }}
      />

      {/* Header */}
      <div style={{opacity: headerOp, transform: `translateY(${headerY}px)`, marginBottom: 56}}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            color: theme.textDim,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          // why zero arena
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.sans,
            fontSize: 56,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: -1.4,
            lineHeight: 1.05,
          }}
        >
          Four things that don&apos;t exist anywhere else.
        </div>
      </div>

      {/* 2x2 grid of bullets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
      >
        {BULLETS.map((b, i) => (
          <BulletRow key={i} bullet={b} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const BulletRow: React.FC<{bullet: Bullet; frame: number}> = ({bullet, frame}) => {
  const {showAt} = bullet;
  const op = interpolate(frame, [showAt, showAt + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(frame, [showAt, showAt + 18], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // Checkmark draws after row arrives.
  const checkProgress = interpolate(frame, [showAt + 6, showAt + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity: op,
        transform: `translateY(${ty}px)`,
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
      }}
    >
      {/* Animated check */}
      <div style={{width: 44, height: 44, flexShrink: 0, marginTop: 4}}>
        <svg viewBox="0 0 44 44" width="44" height="44">
          <circle cx="22" cy="22" r="20" fill="none" stroke={`${theme.accent}66`} strokeWidth="1.5" />
          <polyline
            points={`13,23 ${13 + checkProgress * 5},${23 + checkProgress * 5} ${13 + checkProgress * 18},${23 - checkProgress * 8}`}
            fill="none"
            stroke={theme.accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 28,
            fontWeight: 600,
            color: theme.text,
            letterSpacing: -0.3,
            lineHeight: 1.2,
          }}
        >
          {bullet.text}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: fonts.mono,
            fontSize: 14,
            color: theme.textMuted,
            lineHeight: 1.4,
          }}
        >
          {bullet.detail}
        </div>
      </div>
    </div>
  );
};
