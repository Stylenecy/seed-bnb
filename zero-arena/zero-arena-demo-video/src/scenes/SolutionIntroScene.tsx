// SolutionIntroScene — 10 seconds, 300 frames @ 30fps.
//
// PLAN §4 storyboard #3. Right after Problem's three failure-mode rows,
// this scene names the solution: **Zero Arena**, the on-chain arena for
// AI trading agents. Two layers — Qualifier (static cert, entrance ticket)
// and Arena (live cert, the real verdict). The two pillars are the visual
// centerpiece.
//
// Frame budget:
//   0–40     wordmark + subtitle fade up
//   40–110   tagline types in
//   110–200  two pillars (Qualifier / Arena) lift in from below, staggered
//   200–250  connecting line draws between them with arrow
//   250–300  trailing one-liner caption

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';

const typed = (text: string, frame: number, startFrame: number, cps: number) => {
  if (frame < startFrame) return '';
  const charsPerFrame = cps / 30;
  const count = Math.floor((frame - startFrame) * charsPerFrame);
  return text.slice(0, Math.min(count, text.length));
};

const TAGLINE = 'the on-chain arena for AI trading agents';

export const SolutionIntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Wordmark fade
  const wordmarkOp = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordmarkY = interpolate(frame, [0, 30], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Tagline types in
  const tagline = typed(TAGLINE, frame, 40, 22);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;

  // Pillars
  const pillarOp = (showAt: number) =>
    interpolate(frame, [showAt, showAt + 28], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const pillarY = (showAt: number) =>
    interpolate(frame, [showAt, showAt + 28], [24, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });

  // Connector line draws between pillars
  const connector = interpolate(frame, [200, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Footer caption
  const captionOp = interpolate(frame, [250, 280], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 120px',
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

      {/* Wordmark + tagline */}
      <div style={{opacity: wordmarkOp, transform: `translateY(${wordmarkY}px)`, textAlign: 'center'}}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -2.4,
            color: theme.text,
            lineHeight: 1,
          }}
        >
          Zero <span style={{color: theme.accent}}>Arena</span>
        </div>
        <div style={{height: 36}} />
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 24,
            color: theme.textMuted,
            letterSpacing: 0.5,
            minHeight: 32,
          }}
        >
          <span style={{color: theme.textDim}}>// </span>
          {tagline}
          {tagline.length < TAGLINE.length && cursorOn && (
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 22,
                background: theme.accent,
                marginLeft: 4,
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>
      </div>

      {/* Two pillars container */}
      <div
        style={{
          marginTop: 90,
          display: 'flex',
          gap: 80,
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        {/* Qualifier pillar */}
        <Pillar
          showOp={pillarOp(110)}
          showY={pillarY(110)}
          label="01 · Qualifier"
          tagline="static cert · entrance ticket"
          headline="Does it run honestly on past data?"
          bullets={[
            'Deterministic 15m OHLCV backtest.',
            'runHash anchored on AgentCertificate.',
            'Mint as ERC-7857 iNFT (T1 + T2).',
          ]}
        />

        {/* Connector between pillars */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <svg width={80} height={28} viewBox="0 0 80 28">
            <line
              x1="0"
              y1="14"
              x2={connector * 64}
              y2="14"
              stroke={theme.accent}
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {connector > 0.85 && (
              <polygon
                points={`${connector * 64 - 8},9 ${connector * 64},14 ${connector * 64 - 8},19`}
                fill={theme.accent}
              />
            )}
          </svg>
        </div>

        {/* Arena pillar */}
        <Pillar
          showOp={pillarOp(150)}
          showY={pillarY(150)}
          label="02 · Arena"
          tagline="live cert · the real verdict"
          headline="Does it trade well on unseen candles?"
          bullets={[
            'Paper daemon runs bar-by-bar.',
            'Hash-chained EpochCommitted on-chain.',
            'Seasons rank · permissionless settle.',
          ]}
          accentBorder
        />
      </div>

      {/* Footer caption */}
      <div
        style={{
          marginTop: 64,
          opacity: captionOp,
          fontFamily: fonts.mono,
          fontSize: 19,
          color: theme.textMuted,
          letterSpacing: 0.5,
          textAlign: 'center',
        }}
      >
        <span style={{color: theme.textDim}}>// </span>
        backtest qualifies you ·{' '}
        <span style={{color: theme.accent, fontWeight: 600}}>seasons prove you</span>
      </div>
    </AbsoluteFill>
  );
};

const Pillar: React.FC<{
  showOp: number;
  showY: number;
  label: string;
  tagline: string;
  headline: string;
  bullets: string[];
  accentBorder?: boolean;
}> = ({showOp, showY, label, tagline, headline, bullets, accentBorder}) => (
  <div
    style={{
      opacity: showOp,
      transform: `translateY(${showY}px)`,
      width: 540,
      padding: '36px 36px',
      background: theme.bgElev,
      border: `1px solid ${accentBorder ? theme.accent : theme.border}`,
      borderRadius: 18,
      boxShadow: accentBorder
        ? '0 24px 60px rgba(52, 211, 153, 0.08)'
        : '0 24px 48px rgba(0, 0, 0, 0.4)',
    }}
  >
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 13,
        color: theme.textDim,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 6,
        fontFamily: fonts.mono,
        fontSize: 14,
        color: theme.accent,
      }}
    >
      {tagline}
    </div>
    <div
      style={{
        marginTop: 22,
        fontFamily: fonts.sans,
        fontSize: 28,
        fontWeight: 600,
        color: theme.text,
        letterSpacing: -0.4,
        lineHeight: 1.25,
      }}
    >
      {headline}
    </div>
    <ul
      style={{
        marginTop: 22,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {bullets.map((b, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            fontFamily: fonts.sans,
            fontSize: 17,
            color: theme.textMuted,
            lineHeight: 1.4,
          }}
        >
          <span style={{color: theme.accent, fontFamily: fonts.mono, fontSize: 16, marginTop: 1}}>▸</span>
          {b}
        </li>
      ))}
    </ul>
  </div>
);
