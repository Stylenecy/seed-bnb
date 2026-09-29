import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fonts, theme} from '../theme';

// Deterministic-feeling equity curve. 60 points, smooth-ish growth with drawdowns.
const POINTS = [
  100, 102, 101, 104, 107, 110, 109, 113, 117, 116,
  120, 124, 126, 128, 126, 130, 134, 138, 137, 141,
  144, 143, 146, 152, 155, 159, 156, 152, 148, 145,
  149, 154, 158, 162, 168, 172, 170, 175, 180, 184,
  189, 193, 199, 204, 202, 208, 214, 220, 225, 231,
  236, 241, 248, 252, 258, 265, 272, 276, 279, 282,
];

export const EquityChart: React.FC<{
  width: number;
  height: number;
  startSec: number;
  drawSec: number;
}> = ({width, height, startSec, drawSec}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = startSec * fps;
  const local = Math.max(0, frame - start);
  const draw = interpolate(local, [0, drawSec * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const drawCount = Math.max(2, Math.floor(POINTS.length * draw));
  const visible = POINTS.slice(0, drawCount);
  const min = Math.min(...POINTS) - 6;
  const max = Math.max(...POINTS) + 6;

  const padL = 56;
  const padR = 18;
  const padT = 12;
  const padB = 26;

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const step = innerW / (POINTS.length - 1);

  const points = visible.map((v, i) => {
    const x = padL + i * step;
    const y = padT + ((max - v) / (max - min)) * innerH;
    return [x, y];
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const area = `${line} L ${points[points.length - 1][0].toFixed(2)} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  const lastX = points[points.length - 1][0];
  const lastY = points[points.length - 1][1];
  const lastVal = visible[visible.length - 1];

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map((g) => padT + g * innerH);

  return (
    <svg
      width={width}
      height={height}
      style={{
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 12,
        border: `1px solid ${theme.borderSoft}`,
        fontFamily: fonts.mono,
      }}
    >
      <defs>
        <linearGradient id="eqArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eqLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={theme.accent} />
          <stop offset="50%" stopColor={theme.accent} />
          <stop offset="100%" stopColor={theme.accent} />
        </linearGradient>
      </defs>

      {gridLines.map((y, i) => (
        <line
          key={i}
          x1={padL}
          x2={width - padR}
          y1={y}
          y2={y}
          stroke={theme.borderSoft}
          strokeDasharray="3 6"
        />
      ))}

      {/* y-axis labels */}
      {[0, 0.5, 1].map((g) => {
        const val = max - (max - min) * g;
        const y = padT + g * innerH;
        return (
          <text key={g} x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill={theme.textDim}>
            {Math.round(val)}
          </text>
        );
      })}

      <path d={area} fill="url(#eqArea)" />
      <path d={line} stroke="url(#eqLine)" strokeWidth="2.2" fill="none" />

      {/* trailing dot */}
      <circle cx={lastX} cy={lastY} r="4" fill={theme.accent} />
      <circle cx={lastX} cy={lastY} r="9" fill={theme.accent} fillOpacity="0.25" />

      {/* value label */}
      <g transform={`translate(${Math.min(lastX + 8, width - 80)}, ${lastY - 12})`}>
        <rect width="62" height="22" rx="6" fill="rgba(20,255,122,0.15)" stroke={theme.accent} />
        <text x="31" y="15" textAnchor="middle" fontSize="12" fill={theme.accent} fontWeight="700">
          {lastVal}
        </text>
      </g>

      {/* x-axis label */}
      <text x={padL} y={height - 8} fontSize="11" fill={theme.textDim}>
        Jan
      </text>
      <text x={padL + innerW / 2} y={height - 8} fontSize="11" fill={theme.textDim} textAnchor="middle">
        candle {Math.floor((draw) * 35040).toLocaleString()}
      </text>
      <text x={width - padR} y={height - 8} fontSize="11" fill={theme.textDim} textAnchor="end">
        now
      </text>
    </svg>
  );
};
