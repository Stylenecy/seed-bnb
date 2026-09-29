import {ReactNode} from 'react';
import {fonts, theme} from '../theme';

export const TerminalWindow: React.FC<{
  title?: string;
  width?: number | string;
  height?: number | string;
  children: ReactNode;
}> = ({title = 'zero-arena — zsh', width = 1480, height = 820, children}) => {
  return (
    <div
      style={{
        width,
        height,
        background: theme.bgElev,
        borderRadius: 18,
        border: `1px solid ${theme.border}`,
        boxShadow:
          '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(167,139,250,0.08), 0 0 80px rgba(167,139,250,0.12)',
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
          padding: '0 18px',
          background: theme.bgPanel,
          borderBottom: `1px solid ${theme.borderSoft}`,
          gap: 8,
        }}
      >
        <Dot color="#ff5f57" />
        <Dot color="#febc2e" />
        <Dot color="#28c840" />
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            color: theme.textMuted,
            fontSize: 16,
            letterSpacing: 0.3,
          }}
        >
          {title}
        </div>
        <div style={{width: 48}} />
      </div>
      <div
        style={{
          flex: 1,
          padding: '28px 36px',
          fontSize: 22,
          lineHeight: 1.55,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Dot: React.FC<{color: string}> = ({color}) => (
  <div
    style={{
      width: 14,
      height: 14,
      borderRadius: 14,
      background: color,
    }}
  />
);
