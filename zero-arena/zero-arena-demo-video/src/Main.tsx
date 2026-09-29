import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {SCENE_FRAMES, SCENE_START} from './timing';
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
import {theme} from './theme';

// Per-scene voiceover mapping. Files live in public/audio/.
const VO: Record<keyof typeof SCENE_START, string> = {
  hook: 'audio/vo-01-hook.mp3',
  problem: 'audio/vo-02-problem.mp3',
  solutionIntro: 'audio/vo-03-solution.mp3',
  arch: 'audio/vo-04-architecture.mp3',
  install: 'audio/vo-05-install.mp3',
  backtest: 'audio/vo-06-backtest.mp3',
  certifyMint: 'audio/vo-07-certify-mint.mp3',
  frontend: 'audio/vo-08-frontend.mp3',
  enroll: 'audio/vo-09-enroll.mp3',
  arenaLive: 'audio/vo-10-arena.mp3',
  settle: 'audio/vo-11-settle.mp3',
  reputation: 'audio/vo-12-reputation.mp3',
  advantages: 'audio/vo-13-advantages.mp3',
  closing: 'audio/vo-14-closing.mp3',
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg}}>
      {/* Background music — loops automatically to fill the entire composition.
          Source track is ~74s; Remotion repeats it until composition end and
          the final loop iteration is auto-trimmed at the composition boundary. */}
      <Audio src={staticFile('audio/music-bed.mp3')} volume={0.4} loop />

      <Sequence from={SCENE_START.hook} durationInFrames={SCENE_FRAMES.hook} layout="none">
        <HookScene />
        {/* Hook audio delayed 60f (~2s) so visual plays alone first.
            Audio finale lands on the UNVERIFIED stamp at f320-350. */}
        <Sequence from={60} layout="none">
          <Audio src={staticFile(VO.hook)} volume={2} />
        </Sequence>
      </Sequence>
      <Sequence from={SCENE_START.problem} durationInFrames={SCENE_FRAMES.problem} layout="none">
        <ProblemScene />
        <Audio src={staticFile(VO.problem)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.solutionIntro} durationInFrames={SCENE_FRAMES.solutionIntro} layout="none">
        <SolutionIntroScene />
        <Audio src={staticFile(VO.solutionIntro)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.arch} durationInFrames={SCENE_FRAMES.arch} layout="none">
        <ArchitectureScene />
        <Audio src={staticFile(VO.arch)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.install} durationInFrames={SCENE_FRAMES.install} layout="none">
        <InstallScene />
        <Audio src={staticFile(VO.install)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.backtest} durationInFrames={SCENE_FRAMES.backtest} layout="none">
        <BacktestScene />
        <Audio src={staticFile(VO.backtest)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.certifyMint} durationInFrames={SCENE_FRAMES.certifyMint} layout="none">
        <CertifyMintScene />
        <Audio src={staticFile(VO.certifyMint)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.frontend} durationInFrames={SCENE_FRAMES.frontend} layout="none">
        <FrontendScene />
        <Audio src={staticFile(VO.frontend)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.enroll} durationInFrames={SCENE_FRAMES.enroll} layout="none">
        <EnrollScene />
        <Audio src={staticFile(VO.enroll)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.arenaLive} durationInFrames={SCENE_FRAMES.arenaLive} layout="none">
        <ArenaLiveScene />
        <Audio src={staticFile(VO.arenaLive)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.settle} durationInFrames={SCENE_FRAMES.settle} layout="none">
        <SettleScene />
        <Audio src={staticFile(VO.settle)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.reputation} durationInFrames={SCENE_FRAMES.reputation} layout="none">
        <ReputationScene />
        <Audio src={staticFile(VO.reputation)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.advantages} durationInFrames={SCENE_FRAMES.advantages} layout="none">
        <AdvantagesScene />
        <Audio src={staticFile(VO.advantages)} volume={2} />
      </Sequence>
      <Sequence from={SCENE_START.closing} durationInFrames={SCENE_FRAMES.closing} layout="none">
        <ClosingScene />
        <Audio src={staticFile(VO.closing)} volume={2} />
      </Sequence>
    </AbsoluteFill>
  );
};
