import React from "react";
import { Composition } from "remotion";
import type { VoProps } from "./kit";
import * as IusdPay from "./projects/iusd-pay/Main";
import * as Cermin from "./projects/cermin/Main";
import * as Stax from "./projects/stax/Main";
import * as Claudelance from "./projects/claudelance/Main";
import * as BingoChain from "./projects/bingo-chain/Main";
import * as Equinox from "./projects/equinox/Main";
import * as ZeroArena from "./projects/zero-arena/Main";
import * as Drift from "./projects/drift/Main";
import * as Musashi from "./projects/musashi/Main";
import * as Liber from "./projects/liber/Main";
import * as BridgeAgent from "./projects/bridgeagent/Main";
import * as Flowroll from "./projects/flowroll/Main";
import * as LanceHub from "./projects/lance-hub/Main";
import * as Golda from "./projects/golda/Main";
import * as Tessera from "./projects/tessera/Main";
import * as Gridora from "./projects/gridora/Main";

import * as NeuralAlpha from "./projects/neural-alpha/Main";
/**
 * One composition per project; id = project slug. To add a project:
 *   import * as Foo from "./projects/<slug>/Main";
 *   <Composition id="<slug>" component={Foo.Main} durationInFrames={Foo.TOTAL} … />
 */
const PROJECTS = [{ id: "iusd-pay", mod: IusdPay }, { id: "cermin", mod: Cermin }, { id: "stax", mod: Stax }, { id: "claudelance", mod: Claudelance }, { id: "bingo-chain", mod: BingoChain }, { id: "equinox", mod: Equinox }, { id: "drift", mod: Drift }, { id: "zero-arena", mod: ZeroArena }, { id: "liber", mod: Liber }, { id: "musashi", mod: Musashi }, { id: "flowroll", mod: Flowroll }, { id: "bridgeagent", mod: BridgeAgent }, { id: "golda", mod: Golda }, { id: "lance-hub", mod: LanceHub }, { id: "tessera", mod: Tessera }, { id: "gridora", mod: Gridora }, { id: "neural-alpha", mod: NeuralAlpha }];

/**
 * Voice-over cuts: "<slug>-vo" renders the same Main with { vo: true } (see
 * KIT.md → "Voice-over cut"). The plain "<slug>" comp stays the no-VO cut.
 * One slug per line.
 */
const VO_CUTS: string[] = [
  "neural-alpha",
  "tessera",
  "bingo-chain",
  "equinox",
  "iusd-pay",
  "claudelance",
  "stax",
  "drift",
  "liber",
  "zero-arena",
  "musashi",
  "flowroll",
  "lance-hub",
  "bridgeagent",
  "golda",
  "gridora",
];

export const RemotionRoot: React.FC = () => (
  <>
    {PROJECTS.map(({ id, mod }) => (
      <Composition key={id} id={id} component={mod.Main} durationInFrames={mod.TOTAL} fps={30} width={1920} height={1080} />
    ))}
    {PROJECTS.filter(({ id }) => VO_CUTS.includes(id)).map(({ id, mod }) => (
      <Composition
        key={`${id}-vo`}
        id={`${id}-vo`}
        component={mod.Main as React.FC<VoProps>}
        defaultProps={{ vo: true }}
        durationInFrames={mod.TOTAL}
        fps={30}
        width={1920}
        height={1080}
      />
    ))}
  </>
);
