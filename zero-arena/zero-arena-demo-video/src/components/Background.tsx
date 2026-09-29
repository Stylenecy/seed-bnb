import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {theme} from '../theme';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.3;
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(167,139,250,0.18), transparent 55%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(circle at 50% 110%, rgba(20,255,122,0.10), transparent 60%)`,
          transform: `translate3d(${Math.sin(drift / 40) * 12}px, ${Math.cos(drift / 60) * 10}px, 0)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.borderSoft} 1px, transparent 1px), linear-gradient(90deg, ${theme.borderSoft} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          opacity: 0.18,
          transform: `translate(${(-drift) % 80}px, ${(-drift / 2) % 80}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
