// Funding Rate Hunter — high-frequency MACD with very tight 0.5% / 1.5%
// triggers and conservative 50% size. Built to flip rapidly with MACD bias
// changes, hunting small edges at low size.

import { MacdPerpAgent } from '../02-macd-perp-btc/agent.js';

export default class FundingRateHunter extends MacdPerpAgent {
  constructor() {
    super({ stopLossPct: 0.005, takeProfitPct: 0.015, sizeFraction: 0.5 });
  }
  override toJSON(): Record<string, unknown> {
    return {
      className: 'FundingRateHunter',
      stopLossPct: this.stopLossPct,
      takeProfitPct: this.takeProfitPct,
      sizeFraction: this.sizeFraction,
    };
  }
}
