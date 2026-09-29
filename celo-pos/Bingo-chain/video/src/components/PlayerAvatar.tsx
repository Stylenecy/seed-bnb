import { useMemo, useId } from "react";
import { identicon } from "../lib/identicon";
import { cn } from "../lib/cn";

/** Deterministic identicon avatar — copied from apps/web/components/PlayerAvatar.tsx. */
export function PlayerAvatar({
  address,
  imageUrl,
  size = 28,
  className,
}: {
  address: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const ic = useMemo(() => identicon(address), [address]);
  const uid = useId().replace(/:/g, "");
  const clip = `ic-${uid}`;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-white/10", className)}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("shrink-0 rounded-full ring-1 ring-white/10", className)}
      role="img"
      aria-label=""
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="100" fill={ic.bg} />
        {ic.shapes.map((s, i) => (
          <rect
            key={i}
            width="100"
            height="100"
            fill={s.color}
            transform={`translate(${s.x} ${s.y}) rotate(${s.rot} 50 50) scale(${s.scale})`}
          />
        ))}
      </g>
    </svg>
  );
}
