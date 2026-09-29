// Mean Revert Perp 5x — asymmetric stops (3% SL / 1.5% TP). Bets that MACD
// extremes fade. Smaller wins, bigger losses — needs >2:1 win rate to break
// even, lives or dies by signal accuracy.

import { MacdPerpAgent } from '../02-macd-perp-btc/agent.js';

export default class MeanRevertPerp5x extends MacdPerpAgent {
  constructor() {
    super({ stopLossPct: 0.03, takeProfitPct: 0.015, sizeFraction: 0.8 });
  }
  override toJSON(): Record<string, unknown> {
    return {
      className: 'MeanRevertPerp5x',
      stopLossPct: this.stopLossPct,
      takeProfitPct: this.takeProfitPct,
      sizeFraction: this.sizeFraction,
    };
  }
}
