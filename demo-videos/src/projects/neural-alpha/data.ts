/**
 * Verbatim lines from the REAL runs (scripts/neural-alpha/runs/, 2026-09-25 UTC).
 * Only change: ISO timestamps are shortened to HH:MM:SS, and very long JSON
 * payloads are cut with "…" (the cut part is never a number we show).
 */

/** runs/agent-paper-run.log — AGENT_MODE=paper, BRIDGE_MODE=mock, TWAK off, 8 cycles. */
export const AGENT_CMD = "AGENT_MODE=paper BRIDGE_MODE=mock TWAK_CLI=/usr/bin/false TWAK_WALLET_MODE=skip node src/index.ts";

export const AGENT: { t: string; kind: "info" | "warn" | "brain" | "trade" }[] = [
  { kind: "info", t: '[INFO]  18:30:02 Starting agent {"mode":"paper","bridgeMode":"mock","cmcProApiKey":"not set","initialCash":1000,…}' }, // 0
  { kind: "info", t: "[INFO]  18:30:02 PAPER mode — swaps simulated" }, // 1
  { kind: "warn", t: "[WARN]  18:30:02 DATA SOURCE: MOCK — prices/F&G/trending are simulated, not live CMC" }, // 2
  { kind: "info", t: "[INFO]  18:30:02 === Cycle 1 ===" }, // 3
  { kind: "info", t: '[INFO]  18:30:03 News feed fetched (ClipX) {"count":30}' }, // 4
  { kind: "info", t: '[INFO]  18:30:08 Binance Web3 enrichment applied {"targets":79,"liveQuotes":76,"icons":76,"ohlcvLoaded":76,"fullScan":true}' }, // 5
  { kind: "brain", t: "[BRAIN] 18:30:08 Signal overview — 91 tokens scored · 32 buy · 1 sell · 48 hold · top buys: AAVE (buy, 25), STG (buy, 23) …" }, // 6
  { kind: "brain", t: "[BRAIN] 18:30:08 Trade plan — buy AAVE." }, // 7
  { kind: "trade", t: '[TRADE] 18:30:08 PAPER trade executed {"orderId":"order-1790361008136-1","symbol":"AAVE","side":"buy","amountUsd":60.38}' }, // 8
  { kind: "info", t: '[INFO]  18:30:08 Cycle complete {"cycle":1,"tradesExecuted":1,"portfolioValue":1000,"pnlPct":0,"drawdown":0,…}' }, // 9
  { kind: "trade", t: '[TRADE] 18:30:34 PAPER trade executed {"orderId":"order-1790361034459-2","symbol":"STG","side":"buy","amountUsd":28.05}' }, // 10
  { kind: "info", t: '[INFO]  18:30:34 Cycle complete {"cycle":2,"tradesExecuted":1,"portfolioValue":1000.09,"pnlPct":0.01,…}' }, // 11
  { kind: "trade", t: '[TRADE] 18:31:00 PAPER trade executed {"orderId":"order-1790361060832-3","symbol":"NXPC","side":"buy","amountUsd":28.05}' }, // 12
  { kind: "info", t: '[INFO]  18:31:00 Risk status {"drawdownPct":0,"maxDrawdownLimit":20,"dailyTrades":3,…,"positionCount":3,"maxPositions":3}' }, // 13
  { kind: "info", t: '[INFO]  18:31:00 Cycle complete {"cycle":3,"tradesExecuted":1,"portfolioValue":1000.11,"pnlPct":0.01,…}' }, // 14
  { kind: "brain", t: "[BRAIN] 18:31:27 Trade plan — nothing to execute this cycle." }, // 15
  { kind: "info", t: '[INFO]  18:31:27 Cycle complete {"cycle":4,"tradesExecuted":0,"portfolioValue":1000.11,"pnlPct":0.01,…}' }, // 16
  { kind: "info", t: '[INFO]  18:31:53 Cycle complete {"cycle":5,"tradesExecuted":0,"portfolioValue":1000.16,"pnlPct":0.02,…}' }, // 17
  { kind: "info", t: '[INFO]  18:32:20 Cycle complete {"cycle":6,"tradesExecuted":0,"portfolioValue":1000.16,"pnlPct":0.02,…}' }, // 18
  { kind: "info", t: '[INFO]  18:32:46 Cycle complete {"cycle":7,"tradesExecuted":0,"portfolioValue":1000.16,"pnlPct":0.02,…}' }, // 19
  { kind: "info", t: '[INFO]  18:33:13 Cycle complete {"cycle":8,"tradesExecuted":0,"portfolioValue":1000.16,"pnlPct":0.02,…}' }, // 20
  { kind: "info", t: "[INFO]  18:33:15 Agent stop requested" }, // 21
];

/** runs/trade-history-scan.txt — the project's own fetchRpcRecentTradeHistory() vs bsc-dataseed. */
export const SCAN_CMD = 'fetchRpcRecentTradeHistory("0x0f0067cd819cb8f20bda62046daff7a2b5c88280", 4)';
export const SCAN: string[] = [
  '[INFO] 18:45:58 BSC RPC recent trade scan {"wallet":"0x0f0067cd…","swaps":4,"blocks":5000}',
  "  txHash              from  to    fromAmount          toAmount             price",
  "  0xab624ee8…825a77   FF    USDT  702.9174972038813   93.12345916040819    0.13248135027345564",
  "  0x47661bfc…e7239c   USDT  INJ   77.5995             9.466964318595993    8.196872554760878",
  "  0x733b8155…1bafe6   USDT  ETH   682.8756            0.25341301786172976  2694.7139723208643",
  "  0x3ae3bede…80f0f9   USDT  LTC   46.5507             0.6553621718735079   71.03049580497422",
  "swaps=4 elapsedMs=7199",
];

/** Narrative-Alpha `python -m src run --mode fixture` (verbatim) + pytest. */
export const NARR: string[] = [
  "Top narrative: Memecoins (velocity=9.4, acceleration=0.50)",
  "",
  "Basket (Memecoins):",
  "  RNDR: 40.00% (mcap=$3,845,000,000)",
  "  TAO: 32.09% (mcap=$2,831,000,000)",
  "  HNT: 17.37% (mcap=$1,498,000,000)",
  "  AGIX: 10.54% (mcap=$880,000,000)",
  "",
  "Backtest Results:",
  "  Total Return: 21.54%",
  "  Max Drawdown: -12.46%",
  "  Sharpe Ratio: 0.3202",
  "  Trades: 30",
];
export const NARR_TEST = ["........................  [100%]", "24 passed in 0.24s"];
