// ClosingScene — 6 seconds, 180 frames @ 30fps.
//
// PLAN §4 storyboard #14: single dark screen, large emerald URL centered,
// `npm install zeroarena` small underneath, logo bottom-right at 50%.
// One CTA, one breath. Nothing else.
//
// Frame budget:
//   0–24    URL slides up from below + fades in
//   24–48   underline draws left-to-right under URL
//   48–72   subtitle (npm install) fades in
//   72–108  logo + handle fade in at corners
//   108–180 hold; cursor blink on the URL; subtle URL pulse

import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {fonts, theme} from '../theme';

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();

  // URL slide + fade
  const urlOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const urlY = interpolate(frame, [0, 24], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Underline draw progress
  const underlineProgress = interpolate(frame, [24, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // npm install subtitle fade
  const npmOpacity = interpolate(frame, [48, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Logo + handle corner reveal
  const cornerOpacity = interpolate(frame, [72, 108], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Subtle pulse on URL after fully visible — 2% scale modulation
  const pulse =
    frame >= 108
      ? 1 + Math.sin((frame - 108) * 0.05) * 0.008
      : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        fontFamily: fonts.sans,
        color: theme.text,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Stack: URL, underline, subtitle */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          transform: `translateY(${urlY}px) scale(${pulse})`,
          opacity: urlOpacity,
        }}
      >
        {/* The big URL */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            color: theme.accent,
            lineHeight: 1,
          }}
        >
          zero-arena-fe.vercel.app
        </div>

        {/* Underline — single 4px emerald line, draws left-to-right */}
        <div
          style={{
            width: 1180,
            height: 3,
            background: theme.border,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${underlineProgress * 100}%`,
              background: theme.accent,
            }}
          />
        </div>

        {/* npm install line — JetBrains Mono, smaller */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 28,
            color: theme.textMuted,
            letterSpacing: 0.5,
            opacity: npmOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span style={{color: theme.textDim}}>$</span>
          <span>npm install zeroarena</span>
        </div>
      </div>

      {/* Bottom-left handle (X social) */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 64,
          opacity: cornerOpacity,
          fontFamily: fonts.mono,
          fontSize: 16,
          color: theme.textDim,
          letterSpacing: 0.5,
        }}
      >
        @0arena_labs
      </div>

      {/* Bottom-right logo at 50% opacity */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          right: 64,
          opacity: cornerOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Img
          src={staticFile('logo-compres.png')}
          style={{width: 48, height: 48, objectFit: 'contain'}}
        />
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: theme.text,
            letterSpacing: -0.3,
          }}
        >
          Zero Arena
        </div>
      </div>
    </AbsoluteFill>
  );
};
