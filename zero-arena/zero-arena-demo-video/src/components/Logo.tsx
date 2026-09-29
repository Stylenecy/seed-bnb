import {Img, staticFile} from 'remotion';
import {theme} from '../theme';

export const Logo: React.FC<{size?: number; glow?: boolean}> = ({
  size = 96,
  glow = true,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glow ? (
        <div
          style={{
            position: 'absolute',
            inset: -size * 0.28,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(56,189,248,0.30) 35%, rgba(20,255,122,0.10) 60%, transparent 80%)`,
            filter: 'blur(14px)',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${theme.accent}, ${theme.accent}, ${theme.accent}, ${theme.accent})`,
          padding: 3,
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 3px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 3px))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: size * 0.04,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#0a0a14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('logo.png')}
          style={{
            width: '170%',
            height: '170%',
            objectFit: 'cover',
            // Invert the black logo so ZA reads as light, then nudge toward our violet/cyan brand
            filter:
              'invert(1) brightness(1.15) contrast(1.05) hue-rotate(220deg) saturate(1.4)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(167,139,250,0.25) 90%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};
