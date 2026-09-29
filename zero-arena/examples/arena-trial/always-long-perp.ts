// Zero-warmup demo agent. Opens a LONG position on the very first bar and
// holds. Equity tracks BTC price 1:1 times leverage — so metrics start
// moving as soon as the first candle after the position is opened closes.
//
// Self-contained: only imports from the `zeroarena` npm package, so the
// onboard orchestrator can write this file verbatim to disk and the paper
// runner can resolve it without any relative-path siblings.

import { Agent, type Action, type Observation } from 'zeroarena';

export interface AlwaysLongPerpConfig {
  /** Fraction of equity to deploy. Default 1.0 (full margin). */
  sizeFraction?: number;
}

export class AlwaysLongPerp extends Agent {
  readonly sizeFraction: number;

  constructor(config: AlwaysLongPerpConfig = {}) {
    super();
    this.sizeFraction = config.sizeFraction ?? 1.0;
  }

  override decide(_obs: Observation): Action {
    return { direction: 1, size: this.sizeFraction };
  }

  override toJSON(): Record<string, unknown> {
    return { className: 'AlwaysLongPerp', sizeFraction: this.sizeFraction };
  }
}

export default AlwaysLongPerp;
