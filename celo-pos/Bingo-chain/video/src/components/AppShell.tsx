import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { SpaceBackdrop } from "./SpaceBackdrop";
import { TopNav } from "./TopNav";

/** Shared chrome for every in-app scene: the cosmic backdrop + the desktop
 *  TopNav, with the page content fading-rising in on scene entry (mirrors the
 *  app's `animate-fade-rise`). */
export function AppShell({ active, children }: { active: string; children: ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <AbsoluteFill className="bg-background text-foreground">
      <SpaceBackdrop />
      <div className="relative z-10">
        <TopNav active={active} />
        <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 14}px)` }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
}
