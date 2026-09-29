import {fonts, theme} from '../theme';
import {useCurrentFrame, useVideoConfig} from 'remotion';

type Token = {t: string; c?: string};

export type CodeLine = Token[];

export const CodeEditor: React.FC<{
  filename: string;
  lines: CodeLine[];
  width?: number | string;
  height?: number | string;
  revealStartFrame?: number;
  cps?: number;
}> = ({
  filename,
  lines,
  width = 1480,
  height = 820,
  revealStartFrame = 0,
  cps = 90,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = Math.max(0, frame - revealStartFrame);
  const totalChars = lines.reduce(
    (acc, l) => acc + l.reduce((a, t) => a + t.t.length, 0) + 1,
    0,
  );
  const revealed = Math.min(
    Math.floor(localFrame * (cps / fps)),
    totalChars,
  );

  let used = 0;
  return (
    <div
      style={{
        width,
        height,
        background: theme.bgElev,
        borderRadius: 18,
        border: `1px solid ${theme.border}`,
        boxShadow:
          '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(56,189,248,0.08)',
        overflow: 'hidden',
        fontFamily: fonts.mono,
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          background: theme.bgPanel,
          borderBottom: `1px solid ${theme.borderSoft}`,
          paddingLeft: 18,
          gap: 8,
        }}
      >
        <div style={{width: 12, height: 12, borderRadius: 12, background: '#ff5f57'}} />
        <div style={{width: 12, height: 12, borderRadius: 12, background: '#febc2e'}} />
        <div style={{width: 12, height: 12, borderRadius: 12, background: '#28c840'}} />
        <div style={{marginLeft: 16, display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{color: theme.accent, fontSize: 14}}>📄</span>
          <span style={{color: theme.textMuted, fontSize: 16}}>{filename}</span>
        </div>
      </div>
      <div style={{display: 'flex', flex: 1, fontSize: 22, lineHeight: 1.55}}>
        <div
          style={{
            paddingTop: 22,
            paddingLeft: 18,
            paddingRight: 18,
            color: theme.textDim,
            background: theme.bgPanel,
            borderRight: `1px solid ${theme.borderSoft}`,
            userSelect: 'none',
            textAlign: 'right',
            fontSize: 18,
          }}
        >
          {lines.map((_, i) => (
            <div key={i} style={{height: 22 * 1.55}}>
              {i + 1}
            </div>
          ))}
        </div>
        <div style={{padding: '22px 28px', flex: 1}}>
          {lines.map((line, li) => {
            const out: React.ReactNode[] = [];
            for (let ti = 0; ti < line.length; ti++) {
              const tok = line[ti];
              const remaining = revealed - used;
              if (remaining <= 0) break;
              const take = Math.min(remaining, tok.t.length);
              out.push(
                <span key={`${li}-${ti}`} style={{color: tok.c ?? theme.text}}>
                  {tok.t.slice(0, take)}
                </span>,
              );
              used += take;
              if (take < tok.t.length) break;
            }
            used += 1;
            return (
              <div key={li} style={{whiteSpace: 'pre', minHeight: 22 * 1.55}}>
                {out}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const C = {
  kw: '#c084fc',
  fn: '#7dd3fc',
  str: '#86efac',
  num: '#fbbf24',
  cmt: '#5b5b78',
  type: '#38bdf8',
  prop: '#e879f9',
  def: theme.text,
};
