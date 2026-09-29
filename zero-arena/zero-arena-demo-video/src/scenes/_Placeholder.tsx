// Placeholder scene used as a temporary stub while real scenes are
// being built. Renders the scene name centered against the canvas — so
// the timeline previews end-to-end without compile errors.

import {AbsoluteFill} from 'remotion';
import {fonts, theme} from '../theme';

export const Placeholder: React.FC<{name: string; subtitle?: string}> = ({
  name,
  subtitle,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: theme.bg,
      color: theme.textMuted,
      fontFamily: fonts.sans,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}
  >
    <div
      style={{
        fontSize: 72,
        fontWeight: 700,
        letterSpacing: -1,
        color: theme.text,
      }}
    >
      {name}
    </div>
    {subtitle && (
      <div style={{fontSize: 24, color: theme.textDim}}>{subtitle}</div>
    )}
    <div
      style={{
        marginTop: 32,
        fontSize: 14,
        color: theme.accent,
        fontFamily: fonts.mono,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      placeholder · scene under construction
    </div>
  </AbsoluteFill>
);
