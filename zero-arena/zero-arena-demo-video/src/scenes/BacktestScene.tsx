// BacktestScene — 14 seconds, 420 frames @ 30fps.
//
// PLAN §4 storyboard #6: terminal types `npm start`, dataset header
// appears, a progress bar fills as the candle counter ticks toward 35040,
// then a result panel slides in with the runHash banner + 4 metric tiles.
// Anchored on real token #1 (RSI Classic 30/70) data from production.
//
// Frame budget:
//   0–20    terminal enters
//   20–60   `$ npm start` typed
//   60–90   dataset header (BTCUSDT-15m-spot, 35040 candles, ✓ hash match)
//   90–200  progress bar fills 0 → 100%, candle counter ticks
//   200–220 ✓ backtest complete
//   220–260 result panel slides up + runHash banner reveals
//   260–360 4 metric tiles fade in one by one
//   360–420 runHash highlight pulse + "same hash · every time" caption

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacTerminal, TerminalCursor} from '../components/MacTerminal';

// ─── helpers ──────────────────────────────────────────────────────────────

const typed = (full: string, frame: number, startFrame: number, cps: number) => {
  if (frame < startFrame) return '';
  const chars = Math.floor(((frame - startFrame) * cps) / 30);
  return full.slice(0, Math.min(chars, full.length));
};

const doneTyping = (full: string, frame: number, startFrame: number, cps: number) =>
  frame >= startFrame + Math.ceil((full.length * 30) / cps);

// ─── real data (token #1, RSI Classic 30/70) ─────────────────────────────

const RUN_HASH =
  '0xc2200699d648787d5e7761d207f96bb9bd34c49ad39cd3e9ecd25984cf486e98';
const DATASET_HASH =
  '0xef045d37191201052a600853e2a1f4bdcd0f6abed368b71d237e17b573972361';
const TOTAL_CANDLES = 35040; // BTCUSDT 15m × 365 days

// ─── scene ────────────────────────────────────────────────────────────────

export const BacktestScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Terminal entrance
  const termOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const termY = interpolate(frame, [0, 20], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Command typing
  const cmd = 'npm start';
  const cmdTyped = typed(cmd, frame, 20, 30);
  const cmdDone = doneTyping(cmd, frame, 20, 30);

  // Dataset header reveals
  const datasetShown = frame >= 60;
  const datasetMatchShown = frame >= 78;

  // Progress: 0 → 1 between frames 90 and 200
  const progress = interpolate(frame, [90, 200], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const candles = Math.round(progress * TOTAL_CANDLES);
  const progressShown = frame >= 90;

  // ✓ backtest complete
  const completeShown = frame >= 200;

  // Result panel slide-up
  const resultOpacity = interpolate(frame, [220, 245], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const resultY = interpolate(frame, [220, 245], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // RunHash pulse — subtle border opacity pulse after frame 360
  const hashPulse = frame >= 360 ? 0.5 + Math.sin((frame - 360) * 0.15) * 0.3 : 1;

  // Bottom caption "same hash · every time · for anyone"
  const captionOpacity = interpolate(frame, [380, 400], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Auto-scroll: shift content up between frames 195–220 so progress bar
  // goes above and the result panel has room.
  const scrollY = interpolate(frame, [195, 230], [0, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Cursor blink
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  // Progress bar segments (24 blocks, fill by progress)
  const TOTAL_BLOCKS = 24;
  const filledBlocks = Math.floor(progress * TOTAL_BLOCKS);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.sans,
      }}
    >
      <div style={{transform: `translateY(${termY}px)`, opacity: termOpacity}}>
        <MacTerminal title="zero-arena — zsh" width={1480} height={820}>
          <div style={{position: 'relative', height: '100%', overflow: 'hidden'}}>
            {/* top fade for scrolled-out content */}
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
                opacity: interpolate(frame, [195, 230], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              }}
            />
            <div style={{transform: `translateY(${-scrollY}px)`}}>

              {/* Command line */}
              <Line>
                <Prompt cwd="~/my-agent" />
                <span>{cmdTyped}</span>
                {!cmdDone && <TerminalCursor visible={cursorVisible} />}
              </Line>

              {/* Dataset header */}
              {datasetShown && (
                <>
                  <Spacer />
                  <Line>
                    <span style={{color: theme.textMuted}}>▸</span>{' '}
                    <span>dataset: BTCUSDT-15m-spot · 365d · 35,040 candles</span>
                  </Line>
                  <Line>
                    <span style={{color: theme.textDim, marginLeft: 24}}>
                      datasetHash {short(DATASET_HASH)}
                    </span>
                    {datasetMatchShown && (
                      <span style={{color: theme.accent, marginLeft: 16}}>
                        ✓ matches canonical
                      </span>
                    )}
                  </Line>
                </>
              )}

              {/* Progress bar */}
              {progressShown && (
                <>
                  <Spacer />
                  <Line>
                    <span style={{color: theme.textMuted}}>▸</span>{' '}
                    <span>running deterministic backtest…</span>
                  </Line>
                  <div
                    style={{
                      marginTop: 12,
                      marginLeft: 24,
                      fontFamily: fonts.mono,
                      fontSize: 24,
                      letterSpacing: 1,
                      color: theme.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <span style={{color: theme.textDim}}>[</span>
                    <span style={{display: 'flex', gap: 2}}>
                      {Array.from({length: TOTAL_BLOCKS}).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-block',
                            width: 18,
                            height: 22,
                            background: i < filledBlocks ? theme.accent : theme.borderSoft,
                          }}
                        />
                      ))}
                    </span>
                    <span style={{color: theme.textDim}}>]</span>
                    <span style={{minWidth: 80, color: theme.accent, fontWeight: 600}}>
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      marginLeft: 24,
                      fontFamily: fonts.mono,
                      fontSize: 20,
                      color: theme.textMuted,
                    }}
                  >
                    {candles.toLocaleString()} / {TOTAL_CANDLES.toLocaleString()} candles
                    <span style={{color: theme.textDim, marginLeft: 16}}>
                      pure function of (agentHash, datasetHash, options)
                    </span>
                  </div>
                </>
              )}

              {/* Complete */}
              {completeShown && (
                <>
                  <Spacer />
                  <Line>
                    <span style={{color: theme.accent}}>✓</span>{' '}
                    <span style={{color: theme.text}}>backtest complete</span>
                    <span style={{color: theme.textDim, marginLeft: 16}}>
                      ({TOTAL_CANDLES.toLocaleString()} candles · 137 trades)
                    </span>
                  </Line>
                </>
              )}

              {/* Result — terminal-style key/value output ─────────────── */}
              {frame >= 220 && (
                <div
                  style={{
                    marginTop: 20,
                    opacity: resultOpacity,
                    transform: `translateY(${resultY}px)`,
                    fontFamily: fonts.mono,
                  }}
                >
                  <Line>
                    <span style={{color: theme.textMuted}}>▸</span>{' '}
                    <span style={{color: theme.textMuted, width: 200, display: 'inline-block'}}>
                      runHash
                    </span>
                    <span
                      style={{
                        color: theme.accent,
                        fontWeight: 600,
                        textShadow: `0 0 ${hashPulse * 12}px rgba(52,211,153,${hashPulse * 0.4})`,
                        wordBreak: 'break-all',
                      }}
                    >
                      {RUN_HASH}
                    </span>
                  </Line>

                  <div
                    style={{
                      color: theme.borderSoft,
                      letterSpacing: -2,
                      marginTop: 8,
                      marginBottom: 8,
                    }}
                  >
                    {'─'.repeat(96)}
                  </div>

                  <KvRow label="totalReturn" value="+1.57%" valueColor={theme.posReturn} frame={frame} showAt={260} />
                  <KvRow label="sharpe"      value="2.14"   valueColor={theme.text}      frame={frame} showAt={285} />
                  <KvRow label="maxDrawdown" value="−3.21%" valueColor={theme.negReturn} frame={frame} showAt={310} />
                  <KvRow label="winRate"     value="54.2%"  valueColor={theme.text}      frame={frame} showAt={335} />
                  <KvRow label="trades"      value="137"    valueColor={theme.textMuted} frame={frame} showAt={355} />

                  {frame >= 380 && (
                    <div
                      style={{
                        marginTop: 24,
                        fontSize: 18,
                        color: theme.textMuted,
                        opacity: captionOpacity,
                        letterSpacing: 0.3,
                      }}
                    >
                      <div>
                        <span style={{color: theme.textDim}}>// </span>
                        same dataset · same encrypted agent →{' '}
                        <span style={{color: theme.accent, fontWeight: 600}}>same hash</span>
                      </div>
                      <div>
                        <span style={{color: theme.textDim}}>// </span>
                        T2: owner shares the agent + AES key → verifier reruns →{' '}
                        hash must match
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </MacTerminal>
      </div>
    </AbsoluteFill>
  );
};

// ─── small components ─────────────────────────────────────────────────────

const Prompt: React.FC<{cwd?: string}> = ({cwd = '~/zero-arena'}) => (
  <>
    <span style={{color: theme.accent}}>kiel</span>
    <span style={{color: theme.textDim}}>@</span>
    <span style={{color: theme.text}}>arena</span>
    <span style={{color: theme.textDim}}>:{cwd}</span>
    <span style={{color: theme.textMuted}}>$ </span>
  </>
);

const Line: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', flexWrap: 'wrap'}}>{children}</div>
);

const Spacer: React.FC = () => <div style={{height: 12}} />;

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-8)}`;

// Terminal-flavored key/value row. Indented with ▸ glyph, label fixed width,
// value color-coded. Fades up from showAt for 14 frames.
const KvRow: React.FC<{
  label: string;
  value: string;
  valueColor: string;
  frame: number;
  showAt: number;
}> = ({label, value, valueColor, frame, showAt}) => {
  const op = interpolate(frame, [showAt, showAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tx = interpolate(frame, [showAt, showAt + 14], [-8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        opacity: op,
        transform: `translateX(${tx}px)`,
        marginBottom: 4,
      }}
    >
      <span style={{color: theme.textMuted, width: 28, flexShrink: 0}}>▸</span>
      <span style={{color: theme.textMuted, width: 200, flexShrink: 0}}>{label}</span>
      <span style={{color: valueColor, fontWeight: 600}}>{value}</span>
    </div>
  );
};
