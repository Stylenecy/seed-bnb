import { Composition } from "remotion";
import "./style.css";
import { Demo, TOTAL } from "./Demo";

export function RemotionRoot() {
  return (
    <Composition
      id="BingoChainDemo"
      component={Demo}
      durationInFrames={TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
