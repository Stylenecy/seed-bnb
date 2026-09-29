import { shortAddress } from "../lib/identicon";
import { cn } from "../lib/cn";
import { PlayerAvatar } from "./PlayerAvatar";

const AVATAR_PX = { sm: 20, md: 28, lg: 40 } as const;

/** avatar + label — copied from apps/web/components/Player.tsx, Link → span. */
export function Player({
  address,
  name,
  imageUrl,
  subtitle,
  size = "md",
  className,
}: {
  address: string;
  name?: string;
  imageUrl?: string | null;
  subtitle?: string;
  size?: keyof typeof AVATAR_PX;
  className?: string;
}) {
  const label = name ?? shortAddress(address);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <PlayerAvatar address={address} imageUrl={imageUrl} size={AVATAR_PX[size]} />
      <span className="min-w-0">
        <span className={cn("block truncate text-foreground", name ? "font-medium" : "font-mono text-sm")}>{label}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
