// Trend Follower 3x — wide 6%/12% bands, modest 60% size, lower leverage.
// MACD signals committed to with patience — designed to stay long (or short)
// while the trend persists, taking a back seat on momentum reversals.

import { MacdPerpAgent } from '../02-macd-perp-btc/agent.js';

export default class TrendFollower3x extends MacdPerpAgent {
  constructor() {
    super({ stopLossPct: 0.06, takeProfitPct: 0.12, sizeFraction: 0.6 });
  }
  override toJSON(): Record<string, unknown> {
    return {
      className: 'TrendFollower3x',
      stopLossPct: this.stopLossPct,
      takeProfitPct: this.takeProfitPct,
      sizeFraction: this.sizeFraction,
    };
  }
}
