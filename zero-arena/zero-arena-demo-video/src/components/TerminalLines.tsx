import {ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';

export type TerminalLine =
  | {kind: 'prompt'; text: string; startFrame: number; cps?: number}
  | {kind: 'output'; text: string; startFrame: number; color?: string}
  | {kind: 'spacer'; startFrame: number}
  | {kind: 'jsx'; node: ReactNode; startFrame: number};

export const TerminalLines: React.FC<{
  lines: TerminalLine[];
  cps?: number;
  cwd?: string;
}> = ({lines, cps = 38, cwd = '~/zero-arena'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const charsPerFrame = cps / fps;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      {lines.map((line, i) => {
        if (frame < line.startFrame) return null;
        const localFrame = frame - line.startFrame;

        if (line.kind === 'spacer') {
          return <div key={i} style={{height: 16}} />;
        }

        if (line.kind === 'prompt') {
          const lineCps = line.cps ?? cps;
          const lineCharsPerFrame = lineCps / fps;
          const typed = Math.min(
            Math.floor(localFrame * lineCharsPerFrame),
            line.text.length,
          );
          const text = line.text.slice(0, typed);
          const isLast = i === lines.length - 1;
          const fullyTyped = typed >= line.text.length;
          const showCursor = isLast && fullyTyped && Math.floor(frame / 12) % 2 === 0;
          return (
            <div key={i} style={{whiteSpace: 'pre-wrap'}}>
              <span style={{color: theme.accent}}>➜ </span>
              <span style={{color: theme.accent}}>{cwd} </span>
              <span style={{color: theme.text}}>{text}</span>
              {showCursor ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 22,
                    background: theme.accent,
                    transform: 'translateY(4px)',
                    marginLeft: 2,
                  }}
                />
              ) : null}
            </div>
          );
        }

        if (line.kind === 'output') {
          const reveal = Math.min(
            Math.floor(localFrame * (charsPerFrame * 2)),
            line.text.length,
          );
          return (
            <div
              key={i}
              style={{
                color: line.color ?? theme.text,
                whiteSpace: 'pre-wrap',
              }}
            >
              {line.text.slice(0, reveal)}
            </div>
          );
        }

        if (line.kind === 'jsx') {
          return <div key={i}>{line.node}</div>;
        }

        return null;
      })}
    </div>
  );
};

