// CertifyMintScene — 18 seconds, 540 frames @ 30fps.
//
// PLAN §4 storyboard #7: split layout. Left = MacTerminal showing certify
// → mint commands. Right = MacBrowser showing the chainscan tx pages
// that the terminal references. Real production data for token #1.
//
// Frame budget:
//   0–25     both panes slide in (terminal left, browser right)
//   25–80    `npx zeroarena certify` typed
//   80–180   encrypt → upload 0G Storage progress
//   180–215  cert anchored, certId + storageRoot logged
//   215–280  browser URL bar updates to cert tx, explorer body renders
//   280–340  `npx zeroarena mint` typed in terminal
//   340–410  mint output (thresholds OK, tokenId logged)
//   410–490  browser URL updates to mint tx, explorer body re-renders
//   490–540  hold + caption "strategy never leaves your machine in plaintext"

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme, fonts} from '../theme';
import {MacTerminal, TerminalCursor} from '../components/MacTerminal';
import {MacBrowser} from '../components/MacBrowser';

// ─── real production data (token #1, RSI Classic) ────────────────────────

const RUN_HASH = '0xc2200699d648787d5e7761d207f96bb9bd34c49ad39cd3e9ecd25984cf486e98';
const STORAGE_ROOT = '0xcf47acaaf6f27a0a8f4c865fff288af97780e6163f8d08e8feb3ae46d2e2aaa0';
const DATASET_HASH = '0xef045d37191201052a600853e2a1f4bdcd0f6abed368b71d237e17b573972361';
const OWNER = '0xB1a5402E46d5360D46A9fE0807D3C927b3f50DbD';
const CERT_ADDR = '0x77f29d2a7BcAC679812d9a0FB1c7508eDA6B087e';
const INFT_ADDR = '0xF7162ecbdB11DE4704043D4aF93B4030AD61700e';

// Plausible-looking tx hashes (real txs exist on chain; these are placeholders
// formatted identically). Could be swapped with the actual hashes via gh api
// or chainscan query later.
const CERT_TX = '0xa1e5d7b3c2f4189a6e30b7f8c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4';
const MINT_TX = '0xb2f6e8c4d3a5290b7e41c8f9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5';

// ─── typing helpers ──────────────────────────────────────────────────────

const typed = (full: string, frame: number, startFrame: number, cps: number) => {
  if (frame < startFrame) return '';
  const chars = Math.floor(((frame - startFrame) * cps) / 30);
  return full.slice(0, Math.min(chars, full.length));
};

const doneTyping = (full: string, frame: number, startFrame: number, cps: number) =>
  frame >= startFrame + Math.ceil((full.length * 30) / cps);

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-8)}`;

// ─── scene ────────────────────────────────────────────────────────────────

export const CertifyMintScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance: terminal slides from left, browser from right
  const enter = (delay: number) =>
    interpolate(frame, [delay, delay + 22], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  const tEnter = enter(0);
  const bEnter = enter(6);

  const tx = (1 - tEnter) * -120;
  const bx = (1 - bEnter) * 120;

  // ── Terminal commands ──
  const cmd1 = 'npx zeroarena certify --agent ./agent.ts --csv ./btcusdt-15m.csv';
  const cmd1Done = doneTyping(cmd1, frame, 25, 32);

  const cmd2 = 'npx zeroarena mint --cert 1 --name "RSI Classic 30/70"';
  const cmd2Start = 280;
  const cmd2Done = doneTyping(cmd2, frame, cmd2Start, 32);

  // Upload progress
  const uploadStart = 110;
  const uploadEnd = 165;
  const uploadProgress = interpolate(frame, [uploadStart, uploadEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // ── Terminal auto-scroll to keep cursor visible ──
  const termScrollY = interpolate(frame, [260, 410], [0, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // ── Browser content phases ──
  // Phase 0: loading (frames 215–245)
  // Phase 1: cert tx visible (245–410)
  // Phase 2: mint tx visible (410–540)
  const browserPhase = frame < 215 ? -1 : frame < 245 ? 0 : frame < 410 ? 1 : 2;
  const txInFocus = browserPhase >= 2 ? 'mint' : 'cert';
  const txUrl =
    txInFocus === 'mint'
      ? `https://chainscan.0g.ai/tx/${short(MINT_TX)}`
      : `https://chainscan.0g.ai/tx/${short(CERT_TX)}`;

  // Cursor blink
  const cursor = Math.floor(frame / 15) % 2 === 0;

  // Bottom caption
  const captionOp = interpolate(frame, [490, 510], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <div style={{display: 'flex', gap: 24, alignItems: 'flex-start'}}>
        {/* ── LEFT: Terminal ─────────────────────────────────────────── */}
        <div style={{opacity: tEnter, transform: `translateX(${tx}px)`}}>
          <MacTerminal title="zero-arena — zsh" width={940} height={820}>
            <div style={{position: 'relative', height: '100%', overflow: 'hidden'}}>
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
                  opacity: interpolate(frame, [260, 290], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                }}
              />
              <div
                style={{
                  transform: `translateY(${-termScrollY}px)`,
                  fontSize: 22,
                  lineHeight: 1.5,
                }}
              >
                {/* certify command */}
                <Line>
                  <Prompt />
                  <span>{typed(cmd1, frame, 25, 32)}</span>
                  {!cmd1Done && <TerminalCursor visible={cursor} />}
                </Line>

                {/* certify output */}
                {frame >= 90 && (
                  <>
                    <OutputLine indent>encrypting agent + run log with AES-256-GCM</OutputLine>
                  </>
                )}
                {frame >= 110 && (
                  <>
                    <OutputLine indent>uploading encrypted bundle to 0G Storage</OutputLine>
                    <Progress progress={uploadProgress} indent />
                  </>
                )}
                {frame >= 165 && (
                  <CheckLine indent>
                    <span style={{color: theme.textMuted}}>storageRoot </span>
                    <span style={{color: theme.text}}>{short(STORAGE_ROOT)}</span>
                  </CheckLine>
                )}
                {frame >= 175 && (
                  <OutputLine indent>submitting cert tx to 0G Chain (Aristotle)</OutputLine>
                )}
                {frame >= 195 && (
                  <CheckLine indent>
                    <span style={{color: theme.textMuted}}>cert anchored </span>
                    <span style={{color: theme.text}}>certId=</span>
                    <span style={{color: theme.accent, fontWeight: 600}}>1</span>
                    <span style={{color: theme.textDim}}> · tx </span>
                    <span style={{color: theme.text}}>{short(CERT_TX)}</span>
                  </CheckLine>
                )}

                {/* mint command */}
                {frame >= cmd2Start - 4 && <Spacer />}
                {frame >= cmd2Start && (
                  <Line>
                    <Prompt />
                    <span>{typed(cmd2, frame, cmd2Start, 32)}</span>
                    {!cmd2Done && <TerminalCursor visible={cursor} />}
                  </Line>
                )}

                {/* mint output */}
                {frame >= 340 && (
                  <OutputLine indent>encrypting metadata + uploading</OutputLine>
                )}
                {frame >= 360 && (
                  <OutputLine indent>
                    <span style={{color: theme.textMuted}}>threshold check </span>
                    <span style={{color: theme.accent}}>OK</span>
                    <span style={{color: theme.textDim}}> · sharpe 2.14 ≥ 1.0</span>
                  </OutputLine>
                )}
                {frame >= 380 && (
                  <CheckLine indent>
                    <span style={{color: theme.textMuted}}>minted </span>
                    <span style={{color: theme.text}}>tokenId=</span>
                    <span style={{color: theme.accent, fontWeight: 600}}>1</span>
                    <span style={{color: theme.textDim}}> · tx </span>
                    <span style={{color: theme.text}}>{short(MINT_TX)}</span>
                  </CheckLine>
                )}

                {/* footer note */}
                {frame >= 490 && (
                  <div
                    style={{
                      marginTop: 28,
                      fontSize: 18,
                      color: theme.textMuted,
                      opacity: captionOp,
                    }}
                  >
                    <span style={{color: theme.textDim}}>// </span>
                    strategy never leaves your machine in plaintext
                  </div>
                )}
              </div>
            </div>
          </MacTerminal>
        </div>

        {/* ── RIGHT: Browser ─────────────────────────────────────────── */}
        <div style={{opacity: bEnter, transform: `translateX(${bx}px)`}}>
          <MacBrowser url={txUrl} width={900} height={820}>
            {browserPhase === -1 || browserPhase === 0 ? (
              <BrowserLoading />
            ) : (
              <TxDetail
                phase={txInFocus}
                txHash={txInFocus === 'mint' ? MINT_TX : CERT_TX}
                frame={frame}
              />
            )}
          </MacBrowser>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── small components ─────────────────────────────────────────────────────

const Prompt: React.FC = () => (
  <>
    <span style={{color: theme.accent}}>kiel</span>
    <span style={{color: theme.textDim}}>@</span>
    <span style={{color: theme.text}}>arena</span>
    <span style={{color: theme.textDim}}>:~/my-agent</span>
    <span style={{color: theme.textMuted}}>$ </span>
  </>
);

const Line: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', flexWrap: 'wrap'}}>{children}</div>
);

const Spacer: React.FC = () => <div style={{height: 14}} />;

const OutputLine: React.FC<{indent?: boolean; children: React.ReactNode}> = ({indent, children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', paddingLeft: indent ? 24 : 0, color: theme.textMuted}}>
    <span style={{color: theme.textMuted, marginRight: 12}}>▸</span>
    <span>{children}</span>
  </div>
);

const CheckLine: React.FC<{indent?: boolean; children: React.ReactNode}> = ({indent, children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', paddingLeft: indent ? 24 : 0}}>
    <span style={{color: theme.accent, marginRight: 12, fontWeight: 700}}>✓</span>
    <span>{children}</span>
  </div>
);

const Progress: React.FC<{progress: number; indent?: boolean}> = ({progress, indent}) => {
  const BLOCKS = 18;
  const filled = Math.floor(progress * BLOCKS);
  return (
    <div
      style={{
        marginTop: 6,
        marginBottom: 4,
        paddingLeft: indent ? 24 : 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: fonts.mono,
      }}
    >
      <span style={{color: theme.textDim}}>[</span>
      <span style={{display: 'flex', gap: 2}}>
        {Array.from({length: BLOCKS}).map((_, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 14,
              height: 18,
              background: i < filled ? theme.accent : theme.borderSoft,
            }}
          />
        ))}
      </span>
      <span style={{color: theme.textDim}}>]</span>
      <span style={{color: theme.accent, fontWeight: 600}}>{Math.round(progress * 100)}%</span>
    </div>
  );
};

// ─── browser body components ──────────────────────────────────────────────

const BrowserLoading: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.textDim,
      fontSize: 16,
      fontFamily: fonts.mono,
      letterSpacing: 1,
    }}
  >
    waiting for tx confirmation…
  </div>
);

const TxDetail: React.FC<{phase: 'cert' | 'mint'; txHash: string; frame: number}> = ({
  phase,
  txHash,
  frame,
}) => {
  const isMint = phase === 'mint';
  const fadeIn = interpolate(
    frame,
    isMint ? [410, 440] : [245, 275],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const fnName = isMint ? 'mint(...)' : 'submit(...)';
  const contractAddr = isMint ? INFT_ADDR : CERT_ADDR;
  const contractLabel = isMint ? 'ZeroArenaINFT' : 'AgentCertificate';
  const eventName = isMint ? 'AgentMinted' : 'CertificateSubmitted';
  const block = isMint ? '33,200,612' : '33,200,541';

  return (
    <div style={{opacity: fadeIn, fontFamily: fonts.sans, color: theme.text, fontSize: 16}}>
      {/* Page title */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: theme.text,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        Transaction
        <span
          style={{
            fontSize: 12,
            color: theme.accent,
            background: 'rgba(52, 211, 153, 0.12)',
            border: `1px solid ${theme.accent}40`,
            borderRadius: 4,
            padding: '2px 8px',
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          ✓ Success
        </span>
      </div>

      {/* Tx hash */}
      <Field label="Transaction Hash">
        <span style={{fontFamily: fonts.mono, fontSize: 15, color: theme.text}}>
          {txHash}
        </span>
      </Field>

      <Field label="Block">
        <span style={{fontFamily: fonts.mono, color: theme.accent, fontWeight: 600}}>{block}</span>
      </Field>

      <Field label="From">
        <span style={{fontFamily: fonts.mono, fontSize: 15, color: theme.text}}>
          {OWNER}
        </span>
        <span style={{color: theme.textDim, marginLeft: 8, fontSize: 13}}>(Wallet A)</span>
      </Field>

      <Field label="To">
        <span style={{fontFamily: fonts.mono, fontSize: 15, color: theme.text}}>
          {contractAddr}
        </span>
        <span style={{color: theme.textDim, marginLeft: 8, fontSize: 13}}>({contractLabel})</span>
      </Field>

      <Field label="Function">
        <span style={{fontFamily: fonts.mono, color: theme.accent, fontWeight: 600}}>
          {fnName}
        </span>
      </Field>

      {/* Events */}
      <div
        style={{
          marginTop: 24,
          padding: '14px 16px',
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          background: theme.bgPanel,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: theme.textMuted,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Event Logs (1)
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            color: theme.text,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div>
            <span style={{color: theme.accent}}>event</span>{' '}
            <span style={{color: theme.text}}>{eventName}</span>
            <span style={{color: theme.textDim}}>(</span>
          </div>
          {isMint ? (
            <>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>tokenId: <span style={{color: theme.accent, fontWeight: 600}}>1</span></div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>certificateId: 1</div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>metadataHash: 0xd73d…2a1f3</div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>storageRoot: {short(STORAGE_ROOT)}</div>
            </>
          ) : (
            <>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>certId: <span style={{color: theme.accent, fontWeight: 600}}>1</span></div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>runHash: {short(RUN_HASH)}</div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>datasetHash: {short(DATASET_HASH)}</div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>totalReturnBps: <span style={{color: theme.posReturn, fontWeight: 600}}>+157</span></div>
              <div style={{paddingLeft: 18, color: theme.textMuted}}>trustTier: T2</div>
            </>
          )}
          <div style={{color: theme.textDim}}>)</div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <div style={{display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderBottom: `1px solid ${theme.borderSoft}`}}>
    <div style={{width: 140, color: theme.textMuted, fontSize: 13, fontWeight: 600, letterSpacing: 0.5}}>
      {label}
    </div>
    <div style={{flex: 1}}>{children}</div>
  </div>
);
