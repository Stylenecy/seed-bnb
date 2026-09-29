// InstallScene — 10 seconds, 300 frames @ 30fps.
//
// PLAN §4 storyboard #5 + §10 #7: solid MacTerminal centered on dark
// canvas, character-typed `npx zeroarena init my-agent` → wizard
// flashes a strategy picker → 2-3 quick prompts → success output → `cat
// agent.ts` reveals the decide() function.
//
// Frame budget:
//   0–20    terminal slides up + fades in
//   20–70   user types `npx zeroarena init my-agent`
//   70–90   wizard header: "Pick a strategy template"
//   90–140  5 choices appear, highlight bar scrolls down to RSI, snaps
//   140–200 3 quick prompts auto-answered (market, oversold, wallet)
//   200–240 success output (✓ Wrote agent.ts ...)
//   240–260 `$ cat agent.ts` typed
//   260–300 decide() code reveals progressively

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme} from '../theme';
import {MacTerminal, TerminalCursor} from '../components/MacTerminal';

// Character-typed reveal — returns substring(0, n) where n grows linearly
const typed = (
  full: string,
  frame: number,
  startFrame: number,
  cps: number,
  fps = 30,
): string => {
  if (frame < startFrame) return '';
  const elapsed = frame - startFrame;
  const chars = Math.floor((elapsed * cps) / fps);
  return full.slice(0, Math.min(chars, full.length));
};

// True if frame is past the moment when `full` finishes typing
const doneTyping = (
  full: string,
  frame: number,
  startFrame: number,
  cps: number,
  fps = 30,
): boolean => {
  const framesNeeded = Math.ceil((full.length * fps) / cps);
  return frame >= startFrame + framesNeeded;
};

const STRATEGIES = [
  {key: 'rsi', label: 'RSI Mean Reversion', tag: 'rule-based · spot'},
  {key: 'macd', label: 'MACD Trend', tag: 'rule-based · spot or perp'},
  {key: 'ema', label: 'EMA Crossover', tag: 'rule-based · spot'},
  {key: 'llm', label: 'LLM-driven', tag: 'Claude / GPT / Gemini'},
  {key: 'empty', label: 'Empty scaffold', tag: 'paste your own decide()'},
];

const DECIDE_LINES = [
  'import {Agent, type Action, type Observation} from \'zeroarena\';',
  '',
  'export default class RsiMeanRevAgent extends Agent {',
  '  constructor(public oversold = 30, public overbought = 70) { super(); }',
  '',
  '  decide(obs: Observation): Action {',
  '    if (obs.rsi14 < this.oversold) return {direction: 1, size: 0.5};',
  '    if (obs.rsi14 > this.overbought) return {direction: 0, size: 0};',
  '    return {direction: obs.position > 0 ? 1 : 0, size: obs.position > 0 ? 0.5 : 0};',
  '  }',
  '',
  '  override toJSON() {',
  '    return {className: \'RsiMeanRevAgent\', oversold: this.oversold, overbought: this.overbought};',
  '  }',
  '}',
];

export const InstallScene: React.FC = () => {
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

  // ─── command typing ────────────────────────────────────────────────────
  const cmd1 = 'npx zeroarena init my-agent';
  const cmd1Typed = typed(cmd1, frame, 20, 24);
  const cmd1Done = doneTyping(cmd1, frame, 20, 24);

  // ─── wizard progression ────────────────────────────────────────────────
  const wizardShown = frame >= 70;
  const choicesShown = frame >= 90;
  // Highlight bar moves through choices, lands on RSI (index 0) at frame 130
  const hlIndex =
    frame < 95 ? 4 : frame < 105 ? 3 : frame < 115 ? 2 : frame < 125 ? 1 : 0;
  const selectionDone = frame >= 135;

  // Prompts after selection
  const promptsStart = 140;
  const promptRsiAnswered = frame >= 160;
  const promptOverboughtAnswered = frame >= 180;
  const promptWalletAnswered = frame >= 200;

  // Success
  const successShown = frame >= 200;

  // cat agent.ts
  const cmd2 = 'cat agent.ts';
  const cmd2Done = doneTyping(cmd2, frame, 240, 32);

  // decide() reveal — 2-frame stagger keeps all 17 lines on-screen by 294
  const codeStart = 260;
  const codeStagger = 2;

  // Auto-scroll: real terminals scroll up when output overflows. Translate
  // the content container up between frames 245–290 so the cursor / latest
  // code line stays visible as the wizard output goes off the top.
  const scrollY = interpolate(frame, [245, 295], [0, 400], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Blinking cursor: ~0.5s period
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  // Animated "..." for that moment-before-answer feel. 3 dots cycle every 8 frames.
  const dotCount = (Math.floor(frame / 8) % 3) + 1;
  const dots = '.'.repeat(dotCount);

  // Per-prompt visibility windows so we can show "..." between prompt + answer
  const showMarketPrompt = frame >= 140;
  const showRsiPrompt = frame >= 160;
  const showWalletPrompt = frame >= 180;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{transform: `translateY(${termY}px)`, opacity: termOpacity}}>
        <MacTerminal title="zero-arena — zsh" width={1480} height={820}>
          {/* Scrolling content container: translates up when output overflows. */}
          <div style={{position: 'relative', height: '100%', overflow: 'hidden'}}>
            {/* Top fade — masks content that scrolls off the top so it dissolves cleanly. */}
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
                opacity: interpolate(frame, [245, 260], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              }}
            />
            <div style={{transform: `translateY(${-scrollY}px)`}}>
          {/* ─── Prompt 1: install command ───────────────────────────── */}
          <Line>
            <Prompt />
            <span>{cmd1Typed}</span>
            {!cmd1Done && <TerminalCursor visible={cursorVisible} />}
          </Line>

          {/* ─── Wizard header ───────────────────────────────────────── */}
          {wizardShown && (
            <>
              <Spacer />
              <Line>
                <span style={{color: theme.accent}}>?</span>{' '}
                <span style={{color: theme.text}}>Pick a strategy template</span>
                <span style={{color: theme.textDim}}> (use arrow keys)</span>
              </Line>
            </>
          )}

          {/* ─── Wizard choices ──────────────────────────────────────── */}
          {choicesShown && (
            <div style={{marginTop: 8}}>
              {STRATEGIES.map((s, i) => {
                const isHl = !selectionDone && i === hlIndex;
                const isPicked = selectionDone && s.key === 'rsi';
                return (
                  <div
                    key={s.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 24,
                      gap: 12,
                      color: isPicked
                        ? theme.accent
                        : isHl
                          ? theme.text
                          : theme.textMuted,
                      background: isHl ? 'rgba(52, 211, 153, 0.08)' : 'transparent',
                      borderLeft: isHl
                        ? `3px solid ${theme.accent}`
                        : '3px solid transparent',
                      paddingTop: 2,
                      paddingBottom: 2,
                    }}
                  >
                    <span style={{width: 16}}>
                      {isPicked ? '✓' : isHl ? '›' : ' '}
                    </span>
                    <span style={{minWidth: 280}}>{s.label}</span>
                    <span style={{color: theme.textDim, fontSize: 22}}>
                      {s.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Quick prompts after selection ──────────────────────── */}
          {frame >= promptsStart && selectionDone && (
            <>
              <Spacer />
              {showMarketPrompt && (
                <Line>
                  <span style={{color: theme.accent}}>?</span>{' '}
                  <span>Market:</span>{' '}
                  {promptRsiAnswered ? (
                    <span style={{color: theme.accent}}>spot ✓</span>
                  ) : (
                    <span style={{color: theme.textDim}}>{dots}</span>
                  )}
                </Line>
              )}
              {showRsiPrompt && (
                <Line>
                  <span style={{color: theme.accent}}>?</span>{' '}
                  <span>RSI oversold/overbought:</span>{' '}
                  {promptOverboughtAnswered ? (
                    <span style={{color: theme.accent}}>30/70 ✓</span>
                  ) : (
                    <span style={{color: theme.textDim}}>{dots}</span>
                  )}
                </Line>
              )}
              {showWalletPrompt && (
                <Line>
                  <span style={{color: theme.accent}}>?</span>{' '}
                  <span>Wallet:</span>{' '}
                  {promptWalletAnswered ? (
                    <span style={{color: theme.accent}}>fill .env later ✓</span>
                  ) : (
                    <span style={{color: theme.textDim}}>{dots}</span>
                  )}
                </Line>
              )}
            </>
          )}

          {/* ─── Success output ──────────────────────────────────────── */}
          {successShown && (
            <>
              <Spacer />
              <Line>
                <span style={{color: theme.accent}}>✓</span>{' '}
                <span style={{color: theme.textMuted}}>
                  Wrote agent.ts, run.ts, .env, package.json
                </span>
              </Line>
              <Line>
                <span style={{color: theme.textDim}}>
                  → my-agent/  (Aristotle addresses pre-pinned)
                </span>
              </Line>
            </>
          )}

          {/* ─── cat agent.ts ────────────────────────────────────────── */}
          {frame >= 240 && (
            <>
              <Spacer />
              <Line>
                <Prompt />
                <span>{typed(cmd2, frame, 240, 32)}</span>
                {!cmd2Done && <TerminalCursor visible={cursorVisible} />}
              </Line>
            </>
          )}

          {/* ─── decide() code reveal ────────────────────────────────── */}
          {frame >= codeStart && (
            <div style={{marginTop: 12, fontSize: 22, lineHeight: 1.45}}>
              {DECIDE_LINES.map((line, i) => {
                const lineStart = codeStart + i * codeStagger;
                const op = interpolate(frame, [lineStart, lineStart + 4], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                return (
                  <div
                    key={i}
                    style={{
                      opacity: op,
                      color: line.includes('//') ? theme.textDim : theme.text,
                      whiteSpace: 'pre',
                    }}
                  >
                    <span style={{color: theme.textDim, marginRight: 16}}>
                      {String(i + 1).padStart(2, ' ')}
                    </span>
                    {syntaxColor(line)}
                  </div>
                );
              })}
            </div>
          )}
            </div>{/* /scroll inner */}
          </div>{/* /scroll container */}
        </MacTerminal>
      </div>
    </AbsoluteFill>
  );
};

// ─── helpers ───────────────────────────────────────────────────────────────

const Prompt: React.FC = () => (
  <>
    <span style={{color: theme.accent}}>kiel</span>
    <span style={{color: theme.textDim}}>@</span>
    <span style={{color: theme.text}}>arena</span>
    <span style={{color: theme.textDim}}>:~/</span>
    <span style={{color: theme.textMuted}}>$ </span>
  </>
);

const Line: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', flexWrap: 'wrap'}}>
    {children}
  </div>
);

const Spacer: React.FC = () => <div style={{height: 16}} />;

// Minimal TypeScript-flavored syntax tinting. Strings + keywords + types.
const syntaxColor = (line: string): React.ReactNode => {
  const KEYWORDS = ['import', 'from', 'export', 'default', 'class', 'extends', 'constructor', 'public', 'return', 'if', 'override'];
  const TYPES = ['Agent', 'Action', 'Observation'];
  // Simple split-on-quote string highlight
  const parts: React.ReactNode[] = [];
  let buf = '';
  let inStr = false;
  let key = 0;
  const flush = () => {
    if (!buf) return;
    if (inStr) {
      parts.push(
        <span key={key++} style={{color: theme.accent}}>
          {buf}
        </span>,
      );
    } else {
      // word-by-word coloring
      const tokens = buf.split(/(\s+|[(){};:,])/);
      for (const t of tokens) {
        if (KEYWORDS.includes(t)) {
          parts.push(
            <span key={key++} style={{color: '#c084fc'}}>
              {t}
            </span>,
          );
        } else if (TYPES.includes(t)) {
          parts.push(
            <span key={key++} style={{color: '#60a5fa'}}>
              {t}
            </span>,
          );
        } else {
          parts.push(<span key={key++}>{t}</span>);
        }
      }
    }
    buf = '';
  };
  for (const ch of line) {
    if (ch === "'") {
      if (inStr) {
        buf += ch;
        flush();
        inStr = false;
      } else {
        flush();
        inStr = true;
        buf += ch;
      }
    } else {
      buf += ch;
    }
  }
  flush();
  return <>{parts}</>;
};
