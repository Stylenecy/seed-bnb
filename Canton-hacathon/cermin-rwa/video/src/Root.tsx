import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { FPS, TOTAL_DUR } from "./lib/tokens";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      durationInFrames={TOTAL_DUR}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
