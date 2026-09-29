// Perp Momentum 10x — tight stops, full size, max leverage. The high-octane
// momentum chaser. Riding 10x perp with 1% SL / 4% TP — one bad bar wipes the
// equity by 10%, but trend-aligned MACD signals can compound fast.

import { MacdPerpAgent } from '../02-macd-perp-btc/agent.js';

export default class PerpMomentum10x extends MacdPerpAgent {
  constructor() {
    super({ stopLossPct: 0.01, takeProfitPct: 0.04, sizeFraction: 1.0 });
  }
  override toJSON(): Record<string, unknown> {
    return {
      className: 'PerpMomentum10x',
      stopLossPct: this.stopLossPct,
      takeProfitPct: this.takeProfitPct,
      sizeFraction: this.sizeFraction,
    };
  }
}
