import { AbsoluteFill, Audio, Loop, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { flip } from "@remotion/transitions/flip";
import { fontVars } from "./fonts";
import { Landing } from "./scenes/Landing";
import { Arenas } from "./scenes/Arenas";
import { Create } from "./scenes/Create";
import { Game } from "./scenes/Game";
import { Cup } from "./scenes/Cup";
import { Profile } from "./scenes/Profile";
import { Problem, Solution, WhyOnchain, Cta } from "./scenes/Explainer";

export const SCENE = {
  landing: 480,
  arenas: 260,
  create: 200,
  game: 800,
  cup: 230,
  profile: 220,
  problem: 276,
  solution: 294,
  whyOnchain: 258,
  cta: 220,
};
export const XITION = 22;
// 10 scenes → 9 transitions. TransitionSeries total = sum(scenes) − sum(transitions).
export const TOTAL = Object.values(SCENE).reduce((a, b) => a + b, 0) - 9 * XITION;

const t = () => linearTiming({ durationInFrames: XITION });
// Background music loop length (energysound-powerful-percussion, 68.5s @30fps).
const MUSIC_FRAMES = 2056;

/** Full walkthrough + an explainer outro (problem → solution → why on-chain →
 *  CTA) with epic motion-graphic transitions. Daniel narration at full volume
 *  over the user's percussion bed at 30%. */
export function Demo() {
  return (
    <AbsoluteFill style={{ ...(fontVars as React.CSSProperties), backgroundColor: "#010828" }} className="font-sans">
      <Audio src={staticFile("audio/narration.wav")} volume={1} />
      <Loop durationInFrames={MUSIC_FRAMES}>
        <Audio src={staticFile("audio/energysound-powerful-percussion-513717.mp3")} volume={0.3} />
      </Loop>

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE.landing}>
          <Landing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.arenas}>
          <Arenas />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.create}>
          <Create />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.game}>
          <Game />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.cup}>
          <Cup />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.profile}>
          <Profile />
        </TransitionSeries.Sequence>

        {/* ── Explainer outro — epic transitions ── */}
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.problem}>
          <Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.solution}>
          <Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({ width: 1920, height: 1080 })} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.whyOnchain}>
          <WhyOnchain />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={flip()} timing={t()} />
        <TransitionSeries.Sequence durationInFrames={SCENE.cta}>
          <Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
