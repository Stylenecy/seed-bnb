import './index.css';
import {Composition} from 'remotion';
import {Main} from './Main';
import {TOTAL_FRAMES, FPS, SCENE_FRAMES} from './timing';
import {HookScene} from './scenes/HookScene';
import {ProblemScene} from './scenes/ProblemScene';
import {SolutionIntroScene} from './scenes/SolutionIntroScene';
import {ArchitectureScene} from './scenes/ArchitectureScene';
import {InstallScene} from './scenes/InstallScene';
import {BacktestScene} from './scenes/BacktestScene';
import {CertifyMintScene} from './scenes/CertifyMintScene';
import {FrontendScene} from './scenes/FrontendScene';
import {EnrollScene} from './scenes/EnrollScene';
import {ArenaLiveScene} from './scenes/ArenaLiveScene';
import {SettleScene} from './scenes/SettleScene';
import {ReputationScene} from './scenes/ReputationScene';
import {AdvantagesScene} from './scenes/AdvantagesScene';
import {ClosingScene} from './scenes/ClosingScene';

const W = 1920;
const H = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ZeroArenaDemo" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Hook" component={HookScene} durationInFrames={SCENE_FRAMES.hook} fps={FPS} width={W} height={H} />
      <Composition id="Problem" component={ProblemScene} durationInFrames={SCENE_FRAMES.problem} fps={FPS} width={W} height={H} />
      <Composition id="SolutionIntro" component={SolutionIntroScene} durationInFrames={SCENE_FRAMES.solutionIntro} fps={FPS} width={W} height={H} />
      <Composition id="Architecture" component={ArchitectureScene} durationInFrames={SCENE_FRAMES.arch} fps={FPS} width={W} height={H} />
      <Composition id="Install" component={InstallScene} durationInFrames={SCENE_FRAMES.install} fps={FPS} width={W} height={H} />
      <Composition id="Backtest" component={BacktestScene} durationInFrames={SCENE_FRAMES.backtest} fps={FPS} width={W} height={H} />
      <Composition id="CertifyMint" component={CertifyMintScene} durationInFrames={SCENE_FRAMES.certifyMint} fps={FPS} width={W} height={H} />
      <Composition id="Frontend" component={FrontendScene} durationInFrames={SCENE_FRAMES.frontend} fps={FPS} width={W} height={H} />
      <Composition id="Enroll" component={EnrollScene} durationInFrames={SCENE_FRAMES.enroll} fps={FPS} width={W} height={H} />
      <Composition id="ArenaLive" component={ArenaLiveScene} durationInFrames={SCENE_FRAMES.arenaLive} fps={FPS} width={W} height={H} />
      <Composition id="Settle" component={SettleScene} durationInFrames={SCENE_FRAMES.settle} fps={FPS} width={W} height={H} />
      <Composition id="Reputation" component={ReputationScene} durationInFrames={SCENE_FRAMES.reputation} fps={FPS} width={W} height={H} />
      <Composition id="Advantages" component={AdvantagesScene} durationInFrames={SCENE_FRAMES.advantages} fps={FPS} width={W} height={H} />
      <Composition id="Closing" component={ClosingScene} durationInFrames={SCENE_FRAMES.closing} fps={FPS} width={W} height={H} />
    </>
  );
};
