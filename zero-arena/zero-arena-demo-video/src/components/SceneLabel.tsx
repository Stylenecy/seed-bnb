import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fonts, theme} from '../theme';

export const SceneLabel: React.FC<{
  step: string;
  title: string;
  subtitle?: string;
}> = ({step, title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const inProg = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 80,
        fontFamily: fonts.sans,
        color: theme.text,
        transform: `translateY(${(1 - inProg) * 16}px)`,
        opacity: inProg,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: fonts.mono,
          fontSize: 16,
          color: theme.accent,
          marginBottom: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: 8,
            background: theme.accent,
            boxShadow: `0 0 12px ${theme.accent}`,
          }}
        />
        {step}
      </div>
      <div style={{fontSize: 44, fontWeight: 700, letterSpacing: -0.5}}>
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            fontSize: 20,
            color: theme.textMuted,
            marginTop: 6,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
