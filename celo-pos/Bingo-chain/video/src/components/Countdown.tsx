import { useCurrentFrame, useVideoConfig } from "remotion";

const pad = (n: number) => String(n).padStart(2, "0");

/** Frame-driven countdown (the app's Countdown ticks via setInterval, which is
 *  frozen in a Remotion render; this decrements by elapsed video time so it
 *  visibly ticks). Same styling as apps/web/components/Countdown.tsx. */
export function Countdown({ fromSeconds }: { fromSeconds: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame / fps;
  const s = Math.max(0, Math.floor(fromSeconds - elapsed));
  if (s <= 0) return <span className="font-mono text-sm text-muted-foreground">ended</span>;

  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    <span className="font-mono text-sm font-semibold text-gold-300">
      {d > 0 ? `${d}d ` : ""}
      {pad(h)}:{pad(m)}:{pad(sec)}
    </span>
  );
}
