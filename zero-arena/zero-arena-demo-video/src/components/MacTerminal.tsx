// MacTerminal — macOS-style terminal window per PLAN.md §3.
// Single-layer shadow, no glow, traffic lights, optional glass mode for
// overlay on FE screenshots.

import type {ReactNode} from 'react';
import {fonts, theme} from '../theme';

export interface MacTerminalProps {
  title?: string;
  width?: number | string;
  height?: number | string;
  /**
   * 'solid' (default): opaque body, soft drop shadow. Use against the
   * dark canvas background.
   * 'glass': 16px backdrop-blur over a translucent body. Use ONLY when
   * overlaid on a FE screenshot or other busy backdrop — never on solid.
   */
  variant?: 'solid' | 'glass';
  children: ReactNode;
}

const TRAFFIC_DOT = (color: string): React.CSSProperties => ({
  width: 13,
  height: 13,
  borderRadius: 13,
  background: color,
});

export const MacTerminal: React.FC<MacTerminalProps> = ({
  title = 'zero-arena — zsh',
  width = 1480,
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
        // Glass: translucent fill + backdrop blur. Solid: pure bgElev.
        background: isGlass ? 'rgba(20, 20, 28, 0.78)' : theme.bgElev,
        backdropFilter: isGlass ? 'blur(16px) saturate(140%)' : 'none',
        WebkitBackdropFilter: isGlass ? 'blur(16px) saturate(140%)' : 'none',
        borderRadius: 12,
        // 1px hairline border, slightly brighter on glass to read against varied bg
        border: `1px solid ${isGlass ? 'rgba(255,255,255,0.08)' : theme.border}`,
        // Single-layer soft shadow only — no glow stack
        boxShadow: isGlass
          ? '0 24px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 24px 48px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        fontFamily: fonts.mono,
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title bar — 28px tall, traffic lights left, title centered */}
      <div
        style={{
          height: 28,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          background: isGlass ? 'rgba(28, 28, 38, 0.6)' : theme.bgPanel,
          borderBottom: `1px solid ${theme.borderSoft}`,
          gap: 8,
        }}
      >
        <div style={TRAFFIC_DOT(theme.trafficClose)} />
        <div style={TRAFFIC_DOT(theme.trafficMin)} />
        <div style={TRAFFIC_DOT(theme.trafficMax)} />
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            color: theme.textMuted,
            fontFamily: fonts.sans,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </div>
        {/* Spacer to keep title visually centered against traffic-light cluster */}
        <div style={{width: 51}} />
      </div>
      {/* Body — JetBrains Mono 28pt, line-height 1.5 */}
      <div
        style={{
          flex: 1,
          padding: '28px 36px',
          fontSize: 28,
          lineHeight: 1.5,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Solid emerald block cursor with 600ms blink. Use inline at the end of
 * the last line of input. Per PLAN: not OS underscore — too thin to
 * read at distance.
 */
export const TerminalCursor: React.FC<{visible?: boolean}> = ({
  visible = true,
}) => (
  <span
    style={{
      display: 'inline-block',
      width: '0.55em',
      height: '1em',
      verticalAlign: 'middle',
      marginLeft: 2,
      background: theme.accent,
      opacity: visible ? 1 : 0,
      transition: 'opacity 60ms linear',
    }}
  />
);
