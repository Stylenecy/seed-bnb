// MacBrowser — macOS-style browser window. Mirror of MacTerminal styling
// (traffic lights, single-layer shadow, no glow) but with a URL bar
// instead of a title. Used for chainscan explorer + FE iframe scenes.

import type {ReactNode} from 'react';
import {fonts, theme} from '../theme';

export interface MacBrowserProps {
  url: string;
  width?: number | string;
  height?: number | string;
  variant?: 'solid' | 'glass';
  children: ReactNode;
}

const dot = (color: string): React.CSSProperties => ({
  width: 13,
  height: 13,
  borderRadius: 13,
  background: color,
});

export const MacBrowser: React.FC<MacBrowserProps> = ({
  url,
  width = 900,
  height = 820,
  variant = 'solid',
  children,
}) => {
  const isGlass = variant === 'glass';
  return (
    <div
      style={{
        width,
        height,
        background: isGlass ? 'rgba(20, 20, 28, 0.78)' : theme.bgElev,
        backdropFilter: isGlass ? 'blur(16px) saturate(140%)' : 'none',
        WebkitBackdropFilter: isGlass ? 'blur(16px) saturate(140%)' : 'none',
        borderRadius: 12,
        border: `1px solid ${isGlass ? 'rgba(255,255,255,0.08)' : theme.border}`,
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        fontFamily: fonts.sans,
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 12,
          background: isGlass ? 'rgba(28, 28, 38, 0.6)' : theme.bgPanel,
          borderBottom: `1px solid ${theme.borderSoft}`,
        }}
      >
        <div style={{display: 'flex', gap: 8}}>
          <div style={dot(theme.trafficClose)} />
          <div style={dot(theme.trafficMin)} />
          <div style={dot(theme.trafficMax)} />
        </div>
        {/* URL pill */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: theme.bg,
            border: `1px solid ${theme.borderSoft}`,
            borderRadius: 7,
            padding: '4px 12px',
            height: 26,
            fontFamily: fonts.mono,
            fontSize: 13,
            color: theme.textMuted,
          }}
        >
          <span style={{color: theme.accent, fontSize: 11}}>🔒</span>
          <span>{url}</span>
        </div>
        <div style={{width: 51}} />
      </div>
      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: '24px 28px',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};
