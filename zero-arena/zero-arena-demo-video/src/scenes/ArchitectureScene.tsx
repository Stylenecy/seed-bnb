// ArchitectureScene — 13 seconds, 390 frames @ 30fps.
//
// PLAN §4 storyboard #4. 5-stage Zero Arena lifecycle, arranged as 3+2 rows
// so the cards aren't squeezed and the lower half of the frame is used.
//
// Layout:
//   row 1 (top)    : [01 Author] → [02 Qualify] → [03 Mint]
//                                                    ↓
//   row 2 (bottom) :              [04 Live] → [05 Compete]
//
// Frame budget:
//   0–30     title + subtitle fade
//   30–240   5 cards stagger in with horizontal arrows
//   170–210  inter-row down-arrow draws (between rows)
//   240–320  "ON-CHAIN" badges glow on stages 02/03/04/05
//   320–390  trailing caption "no first-party model · no hosted runtime"

import * as React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';

type Stage = {
  id: string;
  num: string;
  title: string;
  one: string;
  two: string;
  onChain: boolean;
  showAt: number;
};

const STAGES_ROW_1: Stage[] = [
  {
    id: 'author',
    num: '01',
    title: 'Author',
    one: 'Write agent.ts on owner machine.',
    two: 'Strategy stays private — encrypted at rest with AES-256-GCM.',
    onChain: false,
    showAt: 30,
  },
  {
    id: 'qualify',
    num: '02',
    title: 'Qualify',
    one: 'Deterministic backtest → runHash.',
    two: '0G Storage holds the encrypted run log · AgentCertificate anchors metrics on-chain.',
    onChain: true,
    showAt: 70,
  },
  {
    id: 'mint',
    num: '03',
    title: 'Mint',
    one: 'ZeroArenaINFT (ERC-7857).',
    two: 'ReencryptionOracle handles ownership transfers without leaking strategy.',
    onChain: true,
    showAt: 110,
  },
];

const STAGES_ROW_2: Stage[] = [
  {
    id: 'live',
    num: '04',
    title: 'Live',
    one: 'Paper daemon → Binance candles.',
    two: 'LiveCertificate.epochCommit — hash-chained, every 24 h.',
    onChain: true,
    showAt: 170,
  },
  {
    id: 'compete',
    num: '05',
    title: 'Compete',
    one: 'Season enrolls iNFTs.',
    two: 'Permissionless settle() ranks every participant · prizes distributed by live ROI.',
    onChain: true,
    showAt: 210,
  },
];

const CARD_WIDTH = 400;
const CARD_HEIGHT = 240;

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Title strip
  const titleOp = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [0, 30], [-8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Inter-row arrow (drawn after row 1's last card lands)
  const interRowProgress = interpolate(frame, [150, 175], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Footer caption
  const captionOp = interpolate(frame, [320, 350], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ON-CHAIN badge pulse — appears after all stages land (frame 240+)
  const onChainPulse = frame >= 240 ? 0.5 + Math.sin((frame - 240) * 0.18) * 0.5 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        padding: '70px 80px',
        justifyContent: 'flex-start',
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

      {/* Title */}
      <div style={{opacity: titleOp, transform: `translateY(${titleY}px)`}}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            color: theme.textDim,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          // system architecture
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.sans,
            fontSize: 52,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: -1.4,
            lineHeight: 1.1,
          }}
        >
          From your laptop to the on-chain leaderboard.
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: fonts.sans,
            fontSize: 20,
            color: theme.textMuted,
            lineHeight: 1.4,
          }}
        >
          Five stages · four of them anchored on{' '}
          <span style={{color: theme.accent, fontWeight: 600}}>0G Aristotle mainnet</span>.
        </div>
      </div>

      {/* Row 1: stages 01–03 */}
      <div
        style={{
          marginTop: 56,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {STAGES_ROW_1.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <StageBox stage={stage} frame={frame} onChainPulse={onChainPulse} />
            {i < STAGES_ROW_1.length - 1 && (
              <HorizontalArrow showAt={stage.showAt + 18} frame={frame} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Inter-row connector — diagonal from row 1's last card (top-right
          area) to row 2's first card (bottom-left area). Uses an SVG path
          across the gap. */}
      <div
        style={{
          height: 60,
          position: 'relative',
        }}
      >
        <InterRowConnector progress={interRowProgress} />
      </div>

      {/* Row 2: stages 04–05 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {STAGES_ROW_2.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <StageBox stage={stage} frame={frame} onChainPulse={onChainPulse} />
            {i < STAGES_ROW_2.length - 1 && (
              <HorizontalArrow showAt={stage.showAt + 18} frame={frame} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Trailing caption */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 80,
          right: 80,
          opacity: captionOp,
          fontFamily: fonts.mono,
          fontSize: 18,
          color: theme.textMuted,
          textAlign: 'center',
          letterSpacing: 0.5,
        }}
      >
        <span style={{color: theme.textDim}}>// </span>
        no first-party model · no hosted runtime · just{' '}
        <span style={{color: theme.accent, fontWeight: 600}}>infrastructure</span>
      </div>
    </AbsoluteFill>
  );
};

const StageBox: React.FC<{stage: Stage; frame: number; onChainPulse: number}> = ({
  stage,
  frame,
  onChainPulse,
}) => {
  const {showAt} = stage;
  const op = interpolate(frame, [showAt, showAt + 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(frame, [showAt, showAt + 28], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity: op,
        transform: `translateY(${ty}px)`,
        flex: `0 0 ${CARD_WIDTH}px`,
        minHeight: CARD_HEIGHT,
        background: theme.bgElev,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: '22px 22px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
        position: 'relative',
      }}
    >
      {/* Stage number */}
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 13,
          color: theme.textDim,
          letterSpacing: 1.5,
        }}
      >
        {stage.num}
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 6,
          fontFamily: fonts.sans,
          fontSize: 30,
          fontWeight: 700,
          color: theme.text,
          letterSpacing: -0.6,
        }}
      >
        {stage.title}
      </div>

      {/* Description */}
      <div
        style={{
          marginTop: 16,
          fontFamily: fonts.sans,
          fontSize: 16,
          color: theme.text,
          lineHeight: 1.4,
          fontWeight: 500,
        }}
      >
        {stage.one}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: fonts.sans,
          fontSize: 14,
          color: theme.textMuted,
          lineHeight: 1.5,
        }}
      >
        {stage.two}
      </div>

      {/* On-chain badge — pinned to bottom */}
      {stage.onChain && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: `1px solid ${theme.accent}66`,
            background: `rgba(52, 211, 153, ${0.06 + onChainPulse * 0.06})`,
            color: theme.accent,
            padding: '4px 10px',
            borderRadius: 999,
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.8,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 5,
              background: theme.accent,
              boxShadow: `0 0 ${onChainPulse * 8}px ${theme.accent}`,
            }}
          />
          ON-CHAIN
        </div>
      )}
    </div>
  );
};

const HorizontalArrow: React.FC<{showAt: number; frame: number}> = ({showAt, frame}) => {
  const progress = interpolate(frame, [showAt, showAt + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <div
      style={{
        flex: '0 0 64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={64} height={20} viewBox="0 0 64 20">
        <line
          x1="0"
          y1="10"
          x2={progress * 50}
          y2="10"
          stroke={theme.accent}
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        {progress > 0.85 && (
          <polygon
            points={`${progress * 50},10 ${progress * 50 - 7},6 ${progress * 50 - 7},14`}
            fill={theme.accent}
          />
        )}
      </svg>
    </div>
  );
};

// Diagonal connector between row 1 (3 cards) and row 2 (2 cards).
// Row 1 is centered (margin ~296 each side); row 2 is centered (margin
// ~528 each side). So flow goes from row 1's right-of-center down to
// row 2's left-of-center. We draw a 3-segment path: out the bottom of
// card 03, diagonal across the gap, into the top of card 04.
const InterRowConnector: React.FC<{progress: number}> = ({progress}) => {
  // Path in frame coords; container is full-width inside the 80px padding.
  // Row1 last card (03) right-center: x≈1624 from frame left, but inside our
  // padded container that's x≈1544. Card 03 horizontal-center: x≈1424
  // (padded: 1344). We start under card 03 center, end above card 04 center
  // (padded: ~648). Use an SVG that spans the padded width (1760px).
  //
  // Path: vertical down 20, diagonal across, vertical down 20.
  const startX = 1344; // under card 03 center (in padded 1760 coord space)
  const endX = 648;    // above card 04 center
  // Animate as 3 segments at proportional positions.
  const seg1End = 0.2;
  const seg2End = 0.8;
  const tieEnd = 1.0;

  // Vertical segment 1: from y=0 down to y=15
  const v1 = Math.min(progress / seg1End, 1) * 15;
  // Diagonal segment: from (startX, 15) to (endX, 45)
  const dProg = Math.max(0, Math.min((progress - seg1End) / (seg2End - seg1End), 1));
  const dX = startX + (endX - startX) * dProg;
  const dY = 15 + 30 * dProg;
  // Vertical segment 2: from y=45 down to y=60
  const v2Prog = Math.max(0, Math.min((progress - seg2End) / (tieEnd - seg2End), 1));
  const v2 = 45 + v2Prog * 15;

  return (
    <svg
      width="100%"
      height={60}
      viewBox="0 0 1760 60"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0}}
    >
      {/* Segment 1: vertical down from card 03 */}
      <line
        x1={startX}
        y1={0}
        x2={startX}
        y2={v1}
        stroke={theme.accent}
        strokeWidth={2}
        strokeDasharray="4 3"
      />
      {/* Segment 2: diagonal across */}
      {progress > seg1End && (
        <line
          x1={startX}
          y1={15}
          x2={dX}
          y2={dY}
          stroke={theme.accent}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}
      {/* Segment 3: vertical down into card 04 */}
      {progress > seg2End && (
        <>
          <line
            x1={endX}
            y1={45}
            x2={endX}
            y2={v2}
            stroke={theme.accent}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          {progress > 0.95 && (
            <polygon
              points={`${endX},${v2} ${endX - 5},${v2 - 8} ${endX + 5},${v2 - 8}`}
              fill={theme.accent}
            />
          )}
        </>
      )}
    </svg>
  );
};
