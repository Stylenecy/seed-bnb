// ReputationScene — 13 seconds, 390 frames @ 30fps.
//
// PLAN §4 storyboard #12 (revised). Mirror of the actual FE agent detail
// page at /agent/cert-12 (cert #12 · token #12 · Perp Momentum 10x —
// Season #3 perp winner). Structure copied 1:1 from
// `zero-arena-fe/app/agent/[slug]/page.tsx` so the scene reads as a real
// production page. Single visual difference: yellow accents → emerald.
//
// The whole point of this scene is the **bottom 40% of the page** —
// the iNFT card + Trade Outcomes donut chart side-by-side. That's the
// "reputation that compounds" beat. Top half exists only to establish
// "this is a real agent detail page", not to be the focus.
//
// Frame budget:
//   0–30     browser slide in
//   30–90    top: chip row + hero
//   90–170   middle: "Reproduce in your terminal" panel (runHash emphasis)
//   170–250  bottom: iNFT card + Trade Outcomes card frames reveal
//   210–300  donut arcs draw in sequentially (wins → losses → liq)
//   280–340  cursor pans across iNFT details, then Trade Outcomes legend
//   340–390  caption fade

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacBrowser} from '../components/MacBrowser';

// FE palette — copied to keep parity. Yellow → emerald in our brand.
const ZINC_950 = '#09090b';
const ZINC_900 = '#18181b';
const ZINC_800 = '#27272a';
const ZINC_700 = '#3f3f46';
const ZINC_500 = '#71717a';
const ZINC_400 = '#a1a1aa';
const ZINC_300 = '#d4d4d8';
const ZINC_200 = '#e4e4e7';
const ZINC_100 = theme.text;
const EMERALD_400 = theme.accent;
const ROSE_500 = '#f43f5e';
const SKY_300 = '#7dd3fc';
const SKY_BG = 'rgba(56, 189, 248, 0.1)';
const SKY_RING = 'rgba(125, 211, 252, 0.4)';
const VIOLET_400 = '#a78bfa';
const EMERALD_500 = '#10b981';

// Hero data — Perp Momentum 10x (cert #12, token #12) — Season #3 winner.
// Numbers consistent with SettleScene: returnBps 14700 (+147%), winBps 6800.
const AGENT = {
  slug: 'cert-12',
  name: 'Perp Momentum 10x',
  description:
    'High-leverage perp momentum trader on BTC/USDT 15m candles. 10× isolated leverage. Position size scaled by ATR, hard SL at −8%, trailing TP from +25%. Designed for trending regimes; flat in chop.',
  tagline: 'Verifiable backtest — owner shares the agent + AES key to reproduce on real Binance futures candles.',
  initial: 'P',
  authorFull: '0xB1a5402E46d5360D46A9fE0807D3C927b3f50DbD',
  market: 'Futures (perpetual)',
  strategyClass: 'Perp Momentum',
  trustTier: 'T2',
  trustTierLabel: 'Reproducibility',
  mints: 4,
  tokenId: 12,
  certId: 12,
  leverage: 10,
  runHash: '0x4f94a947fe6d71aeee356788df51c3d98d8a7e6c69d7bc434ca7686fdc7a9bc0',
  // Trade outcomes — consistent with SettleScene winBps 6800 (≈68% win rate).
  // Some liquidations realistic at 10× leverage.
  wins: 78,
  losses: 36,
  liquidations: 3,
};

const ownerShort = '0xB1a5…0DbD';

export const ReputationScene: React.FC = () => {
  const frame = useCurrentFrame();

  const browserOp = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const captionOp = interpolate(frame, [340, 370], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center'}}
    >
      <div style={{opacity: browserOp}}>
        <MacBrowser
          url={`zero-arena-fe.vercel.app/agent/${AGENT.slug}`}
          width={1700}
          height={950}
        >
          <AgentDetailPage frame={frame} />
        </MacBrowser>
      </div>

      {frame >= 340 && (
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            fontFamily: fonts.mono,
            fontSize: 18,
            color: theme.textMuted,
            opacity: captionOp,
            letterSpacing: 0.5,
            textAlign: 'center',
          }}
        >
          <span style={{color: theme.textDim}}>// </span>
          every win is a permanent on-chain credential ·{' '}
          <span style={{color: EMERALD_400, fontWeight: 600}}>reputation that compounds</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Agent detail page mirror ────────────────────────────────────────────

const AgentDetailPage: React.FC<{frame: number}> = ({frame}) => {
  // Top-band reveals
  const backOp = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const chipsOp = interpolate(frame, [40, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const heroOp = interpolate(frame, [60, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Reproduce panel
  const reproOp = interpolate(frame, [90, 140], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // iNFT + Trade Outcomes — main focus
  const bottomOp = interpolate(frame, [170, 220], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Tabs strip
  const tabsOp = interpolate(frame, [240, 270], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontFamily: fonts.sans,
        color: ZINC_100,
        background: ZINC_950,
        padding: '14px 28px 24px',
        maxWidth: 1700,
      }}
    >
      {/* Back link */}
      <div style={{opacity: backOp, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: ZINC_400}}>
        <ChevronLeft />
        Agent Registry
      </div>

      {/* Chip row + right actions */}
      <div
        style={{
          opacity: chipsOp,
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <Chip>{AGENT.market}</Chip>
          <Chip>{AGENT.strategyClass}</Chip>
          <TrustTierChip />
          <OperatorChip />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <ActionBtn icon={<ShieldIcon />}>{AGENT.mints} mints</ActionBtn>
          <ActionBtn icon={<ExternalIcon />}>0G Explorer</ActionBtn>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          opacity: heroOp,
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, maxWidth: 1100}}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 56,
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
            {AGENT.initial}
          </div>
          <div>
            <div style={{fontSize: 24, fontWeight: 600, letterSpacing: -0.4}}>{AGENT.name}</div>
            <div style={{fontSize: 11, color: ZINC_500, marginTop: 4}}>
              Author{' '}
              <span style={{fontFamily: fonts.mono, color: ZINC_300}}>
                {ownerShort}
              </span>
            </div>
            <p
              style={{
                marginTop: 10,
                fontSize: 13,
                color: ZINC_400,
                lineHeight: 1.55,
                maxWidth: 800,
              }}
            >
              {AGENT.description}
            </p>
            <p
              style={{
                marginTop: 8,
                fontSize: 11,
                color: ZINC_500,
                fontStyle: 'italic',
              }}
            >
              {AGENT.tagline}
            </p>
          </div>
        </div>

        {/* Action stack */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, width: 180, flexShrink: 0}}>
          <PrimaryBtn>Mint iNFT</PrimaryBtn>
          <SecondaryBtn>Clone &amp; Re-run</SecondaryBtn>
          <SecondaryBtn>Verify Run</SecondaryBtn>
        </div>
      </div>

      {/* Reproduce in terminal panel (compact) — links to Backtest scene's runHash */}
      <div style={{opacity: reproOp, marginTop: 18}}>
        <ReproduceTerminalPanel frame={frame} />
      </div>

      {/* iNFT + Trade Outcomes — the bottom focus */}
      <div
        style={{
          opacity: bottomOp,
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 360px)',
          gap: 14,
        }}
      >
        <INFTCard />
        <TradeOutcomesCard frame={frame} />
      </div>

      {/* Tabs strip */}
      <div
        style={{
          opacity: tabsOp,
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          borderBottom: `1px solid ${ZINC_800}`,
          fontSize: 13,
        }}
      >
        {[
          {label: 'Trades', active: true},
          {label: 'Certificate', active: false},
          {label: 'Mint History', active: false},
          {label: 'Owners', active: false},
        ].map((tab) => (
          <button
            key={tab.label}
            style={{
              position: 'relative',
              paddingBottom: 10,
              background: 'transparent',
              border: 'none',
              color: tab.active ? ZINC_100 : ZINC_500,
              fontWeight: tab.active ? 600 : 400,
              fontSize: 13,
              fontFamily: fonts.sans,
              cursor: 'default',
            }}
          >
            {tab.label}
            {tab.active && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  borderRadius: 2,
                  background: EMERALD_400,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────

const Chip: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span
    style={{
      borderRadius: 999,
      background: ZINC_800,
      padding: '4px 12px',
      fontSize: 11,
      color: ZINC_300,
    }}
  >
    {children}
  </span>
);

const TrustTierChip: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      borderRadius: 8,
      background: SKY_BG,
      padding: '5px 12px',
      fontSize: 11,
      fontWeight: 600,
      color: SKY_300,
      border: `1px solid ${SKY_RING}`,
    }}
  >
    <ShieldIcon size={12} color={SKY_300} />
    T2 · {AGENT.trustTierLabel}
  </span>
);

const OperatorChip: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 999,
      background: 'rgba(52, 211, 153, 0.15)',
      padding: '5px 12px',
      fontSize: 11,
      color: EMERALD_400,
      border: `1px solid ${EMERALD_400}66`,
      fontWeight: 500,
    }}
  >
    Operator: Zero Arena
  </span>
);

const ActionBtn: React.FC<{children: React.ReactNode; icon: React.ReactNode}> = ({children, icon}) => (
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
    {icon}
    {children}
  </span>
);

const PrimaryBtn: React.FC<{children: React.ReactNode}> = ({children}) => (
  <button
    style={{
      borderRadius: 8,
      background: EMERALD_400,
      color: '#0a0a0f',
      padding: '8px 0',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: fonts.sans,
      border: 'none',
      cursor: 'default',
    }}
  >
    {children}
  </button>
);

const SecondaryBtn: React.FC<{children: React.ReactNode}> = ({children}) => (
  <button
    style={{
      borderRadius: 8,
      background: ZINC_900,
      border: `1px solid ${ZINC_700}`,
      color: ZINC_200,
      padding: '8px 0',
      fontSize: 13,
      fontWeight: 500,
      fontFamily: fonts.sans,
      cursor: 'default',
    }}
  >
    {children}
  </button>
);

// ─── Reproduce in terminal panel ────────────────────────────────────────

const ReproduceTerminalPanel: React.FC<{frame: number}> = ({frame}) => {
  const step3Highlight = interpolate(frame, [130, 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${ZINC_800}cc`,
        background: 'rgba(24, 24, 27, 0.6)',
        padding: '14px 18px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontSize: 13, fontWeight: 600, color: ZINC_100}}>Reproduce in your terminal</div>
        <span
          style={{
            background: ZINC_800,
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 10,
            color: ZINC_300,
            fontWeight: 500,
          }}
        >
          Verifier flow
        </span>
      </div>

      {/* 3 steps in compact horizontal layout */}
      <div style={{marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
        <ReproStep n={1} label="Install the SDK" cmd="npm install zeroarena" />
        <ReproStep
          n={2}
          label="Re-run the certified backtest"
          cmd={`npx zeroarena verify ${AGENT.certId} --agent ./agent.ts --csv ./btc.csv`}
        />
        <ReproStep
          n={3}
          label="Expected output (this exact runHash):"
          cmd={AGENT.runHash}
          accentRunHash
          highlight={step3Highlight}
        />
      </div>
    </div>
  );
};

const ReproStep: React.FC<{
  n: number;
  label: string;
  cmd: string;
  accentRunHash?: boolean;
  highlight?: number;
}> = ({n, label, cmd, accentRunHash, highlight = 0}) => {
  const truncated = cmd.length > 56 ? `${cmd.slice(0, 30)}…${cmd.slice(-12)}` : cmd;
  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: ZINC_500}}>
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            background: ZINC_800,
            color: ZINC_300,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {n}
        </span>
        {label}
      </div>
      <div
        style={{
          marginTop: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 8,
          border: `1px solid ${accentRunHash && highlight > 0.2 ? `${EMERALD_400}66` : ZINC_800}`,
          background: accentRunHash && highlight > 0.4
            ? `rgba(52, 211, 153, ${0.04 + highlight * 0.04})`
            : ZINC_950,
          padding: '6px 10px',
          boxShadow: accentRunHash && highlight > 0.7
            ? `0 0 ${highlight * 12}px ${EMERALD_400}22`
            : 'none',
        }}
      >
        <span style={{color: ZINC_700, fontFamily: fonts.mono, fontSize: 11}}>$</span>
        <span
          style={{
            flex: 1,
            fontFamily: fonts.mono,
            fontSize: 11,
            color: accentRunHash ? EMERALD_400 : ZINC_200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {truncated}
        </span>
        <CopyIcon />
      </div>
    </div>
  );
};

// ─── iNFT card ───────────────────────────────────────────────────────────

const INFTCard: React.FC = () => (
  <div
    style={{
      borderRadius: 16,
      border: `1px solid ${ZINC_800}cc`,
      background: 'rgba(24, 24, 27, 0.6)',
      padding: '18px',
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div style={{fontSize: 14, fontWeight: 600, color: ZINC_100}}>iNFT</div>
      <span
        style={{
          background: ZINC_800,
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 10,
          color: ZINC_300,
          fontWeight: 500,
        }}
      >
        ERC-7857
      </span>
    </div>

    <div style={{marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
      <INFTField label="Token ID" value={`#${AGENT.tokenId}`} mono />
      <INFTField label="Mints" value={AGENT.mints.toString()} />
      <INFTField label="Owner" value={ownerShort} mono />
    </div>

    <p
      style={{
        marginTop: 16,
        fontSize: 11,
        color: ZINC_500,
        lineHeight: 1.6,
        maxWidth: 720,
      }}
    >
      Transfers route through the ReencryptionOracle so a new owner receives a re-encrypted
      copy of the agent without ever seeing the underlying source. Vanilla ERC-721
      transferFrom is disabled for tokens with encrypted metadata.
    </p>
  </div>
);

const INFTField: React.FC<{label: string; value: string; mono?: boolean}> = ({label, value, mono}) => (
  <div>
    <div style={{fontSize: 11, color: ZINC_500}}>{label}</div>
    <div
      style={{
        marginTop: 2,
        fontSize: 13,
        color: ZINC_200,
        fontFamily: mono ? fonts.mono : fonts.sans,
        fontWeight: mono ? 400 : 500,
      }}
    >
      {value}
    </div>
  </div>
);

// ─── Trade Outcomes card — donut chart with animated arcs ────────────────

const TradeOutcomesCard: React.FC<{frame: number}> = ({frame}) => {
  // Sequential arc draw: wins first (frames 210-250), losses next (250-285),
  // liquidations last (285-310).
  const winsProgress = interpolate(frame, [210, 250], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const lossProgress = interpolate(frame, [250, 285], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const liqProgress = interpolate(frame, [285, 310], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Legend rows fade in synced with their slice
  const winsLegendOp = interpolate(frame, [220, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lossLegendOp = interpolate(frame, [255, 275], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const liqLegendOp = interpolate(frame, [290, 305], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${ZINC_800}cc`,
        background: 'rgba(24, 24, 27, 0.6)',
        padding: '18px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: ZINC_100}}>
          Trade Outcomes
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: ZINC_400,
          }}
        >
          30 Days <ChevronDown />
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 16,
        }}
      >
        <OutcomeDonut
          wins={AGENT.wins}
          losses={AGENT.losses}
          liquidations={AGENT.liquidations}
          winsProgress={winsProgress}
          lossProgress={lossProgress}
          liqProgress={liqProgress}
        />
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12}}>
          <LegendRow
            color={EMERALD_500}
            label="Wins"
            value={AGENT.wins}
            op={winsLegendOp}
          />
          <LegendRow
            color={ROSE_500}
            label="Losses"
            value={AGENT.losses}
            op={lossLegendOp}
          />
          <LegendRow
            color={VIOLET_400}
            label="Liq."
            value={AGENT.liquidations}
            op={liqLegendOp}
          />
        </div>
      </div>
    </div>
  );
};

const LegendRow: React.FC<{color: string; label: string; value: number; op: number}> = ({
  color,
  label,
  value,
  op,
}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 8, opacity: op}}>
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 8,
        background: color,
        flexShrink: 0,
      }}
    />
    <span style={{width: 56, color: ZINC_400}}>{label}</span>
    <span style={{fontFamily: fonts.mono, color: ZINC_200, fontWeight: 500}}>{value}</span>
  </div>
);

const OutcomeDonut: React.FC<{
  wins: number;
  losses: number;
  liquidations: number;
  winsProgress: number;
  lossProgress: number;
  liqProgress: number;
}> = ({wins, losses, liquidations, winsProgress, lossProgress, liqProgress}) => {
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = wins + losses + liquidations || 1;
  const circumference = 2 * Math.PI * radius;

  // Arc lengths in path-units
  const winsLen = (wins / total) * circumference;
  const lossLen = (losses / total) * circumference;
  const liqLen = (liquidations / total) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={ZINC_800} strokeWidth={stroke} />

      {/* Wins (emerald) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={EMERALD_500}
        strokeWidth={stroke}
        strokeDasharray={`${winsLen * winsProgress} ${circumference - winsLen * winsProgress}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />

      {/* Losses (rose) — offset by full wins length */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={ROSE_500}
        strokeWidth={stroke}
        strokeDasharray={`${lossLen * lossProgress} ${circumference - lossLen * lossProgress}`}
        strokeDashoffset={-winsLen}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />

      {/* Liquidations (violet) — offset by wins+losses */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={VIOLET_400}
        strokeWidth={stroke}
        strokeDasharray={`${liqLen * liqProgress} ${circumference - liqLen * liqProgress}`}
        strokeDashoffset={-(winsLen + lossLen)}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
    </svg>
  );
};

// ─── Icons ───────────────────────────────────────────────────────────────

const ChevronLeft: React.FC = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronDown: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke={ZINC_400} strokeWidth="1.5">
    <path d="M3 4.5l3 3 3-3" />
  </svg>
);

const ShieldIcon: React.FC<{size?: number; color?: string}> = ({size = 13, color = ZINC_300}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <path d="M8 1l6 2v5.2c0 3-2.5 5.7-6 6.8-3.5-1.1-6-3.8-6-6.8V3l6-2zm-.7 9.5l4-4-1-1-3 3-1.3-1.3-1 1L7.3 10.5z" />
  </svg>
);

const ExternalIcon: React.FC<{size?: number}> = ({size = 12}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ZINC_300} strokeWidth="1.6">
    <path d="M14 4h6v6M10 14L20 4M19 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h5" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={ZINC_500} strokeWidth="1.6">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);
