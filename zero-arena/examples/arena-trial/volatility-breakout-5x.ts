// Volatility Breakout 5x — wider stops, partial size, ride big moves. MACD
// signals filtered through wider 4%/8% bands so the agent stays in expansion
// regimes longer. Designed to be patient through chop.

import { MacdPerpAgent } from '../02-macd-perp-btc/agent.js';

export default class VolatilityBreakout5x extends MacdPerpAgent {
  constructor() {
    super({ stopLossPct: 0.04, takeProfitPct: 0.08, sizeFraction: 0.7 });
  }
  override toJSON(): Record<string, unknown> {
    return {
      className: 'VolatilityBreakout5x',
      stopLossPct: this.stopLossPct,
      takeProfitPct: this.takeProfitPct,
      sizeFraction: this.sizeFraction,
    };
  }
}
