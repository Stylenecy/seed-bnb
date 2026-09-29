import { staticFile } from "remotion";

/** In-app cosmic backdrop — adapted from apps/web/components/SpaceBackdrop.tsx
 *  (next/Image → img, usePathname removed). Same dimmed space-bg, legibility
 *  veil, neon aurora, and film grain. */
export function SpaceBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-navy">
      <img
        src={staticFile("space-bg.jpg")}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover object-[50%_28%] opacity-70 [filter:blur(2px)]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/50 via-navy/70 to-navy/95" />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(42rem 30rem at 82% -10%, hsl(var(--primary) / 0.13), transparent 62%)",
        }}
      />
      <div className="noise-bg absolute inset-0 opacity-[0.5] mix-blend-soft-light" />
    </div>
  );
}
