import React, { createContext, useContext } from "react";
import type { BeatGrid } from "./beat";

/**
 * The project's BeatGrid, provided once at the top of Main.tsx so kit
 * components (Pulse, Flashes, BeatPop…) can read the beat without prop
 * drilling:  <BeatProvider grid={G}> … </BeatProvider>
 */
const Ctx = createContext<BeatGrid | null>(null);

export const BeatProvider: React.FC<{ grid: BeatGrid; children: React.ReactNode }> = ({ grid, children }) => (
  <Ctx.Provider value={grid}>{children}</Ctx.Provider>
);

export const useBeat = (): BeatGrid => {
  const g = useContext(Ctx);
  if (!g) throw new Error("useBeat() must be used inside <BeatProvider>");
  return g;
};

/**
 * The comp frame at which the current scene's local frame 0 sits. Provided by
 * <SceneTimeline> so Pulse & friends can convert local → comp frames.
 */
export const SceneStartCtx = createContext<number>(0);
export const useSceneStart = (): number => useContext(SceneStartCtx);
