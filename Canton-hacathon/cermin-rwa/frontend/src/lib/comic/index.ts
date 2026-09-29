/**
 * Comic UI kit — small, tree-shakeable pieces of the Cermin comic design
 * language (STATE.md §2 "FE DESIGN LANGUAGE: COMIC CONSUMER APP"), ported from
 * the launch video's `comicFx`. Import individual pieces; nothing here pulls in
 * anything else it doesn't need.
 */

export { Halftone } from './Halftone';
export { InkCard } from './InkCard';
export { ComicTag } from './ComicTag';
export { SpeechBubble } from './SpeechBubble';
export { SpeedBurst } from './SpeedBurst';
export { Mascot, type MascotPose } from './Mascot';
export { CoinBurst } from './CoinBurst';
export { SavedBurst } from './SavedBurst';

export { usePrefersReducedMotion, prefersReducedMotion, useOneShot } from './motion';
export { seededRandom, seededRange, hashSeed } from './rng';
export { radialMaskStyle } from './mask';
export { buildSpeedRays, buildCoinArcs, VIEWBOX, CENTER } from './geometry';
