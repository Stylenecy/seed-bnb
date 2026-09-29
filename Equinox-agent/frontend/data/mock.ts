export type RiskProfile = "conservative" | "balanced" | "aggressive";

export const BNB_PRICE = 700;

export const mockUser = {
  email: "ezranhmry@gmail.com",
  name: "Ezra",
  walletAddress: "0x8f3e9b2a7c4d6f1e8a5b3c9d2e4f7a1b8c5d6e9f0a3b2c1d4e5f6a7b8c9d0e1f",
  bnbBalance: 14.2,
};

export const mockPosition = {
  collateralBnb: 5,
  collateralUsd: 5 * BNB_PRICE,
  activeDebtUsdt: 1193,
  originalDebtUsdt: 1925,
  shadowBalanceUsdt: 42.5,
  healthFactor: 1.62,
  liquidationPrice: 490,
  ltv: 0.55,
  ltvMax: 0.65,
  risk: "balanced" as RiskProfile,
  mode: "Loan + Auto-Repay",
  manifestoVersion: "1.0.0",
  manifestoHash: "0xabc1238f3e9b2a7c4d6f1e8a5b3c9d2e4f7a1b8c5d",
  targetPayoff: "2026-08-12",
  openedAt: "2026-01-08T10:42:00Z",
  allocations: {
    lista: 720,
    pancake: 530,
  },
  spreadCapturedTotal: 732,
  daysActive: 132,
};

export const repaymentProgress = {
  percent: 38,
  status: "on-track" as "on-track" | "ahead" | "behind",
  projectedPayoff: "Aug 12, 2026",
};

export type ActivityKind =
  | "spread"
  | "rebalance"
  | "shadow"
  | "defense"
  | "deposit"
  | "withdraw";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  timestamp: string;
  title: string;
  detail: string;
  amount?: number;
}

export const activityFeed: ActivityEvent[] = [
  {
    id: "evt_1",
    kind: "spread",
    timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
    title: "Spread captured",
    detail: "Debt reduced via Lista interest delta",
    amount: 0.42,
  },
  {
    id: "evt_2",
    kind: "rebalance",
    timestamp: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
    title: "Rebalanced allocation",
    detail: "Shifted $50 from Lista into PancakeSwap LP (APR delta 0.71%)",
  },
  {
    id: "evt_3",
    kind: "spread",
    timestamp: new Date(Date.now() - 8 * 60 * 60_000).toISOString(),
    title: "Spread captured",
    detail: "Debt reduced via PancakeSwap LP fees",
    amount: 0.38,
  },
  {
    id: "evt_4",
    kind: "shadow",
    timestamp: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    title: "Shadow Wallet topped up",
    detail: "BNB appreciation +2.1%, $5.20 routed to Shadow",
    amount: 5.2,
  },
  {
    id: "evt_5",
    kind: "defense",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
    title: "Defense triggered",
    detail: "Health Factor restored from 1.28 → 1.55",
  },
  {
    id: "evt_6",
    kind: "spread",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
    title: "Spread captured",
    detail: "Aggregated yield from both venues",
    amount: 1.14,
  },
  {
    id: "evt_7",
    kind: "deposit",
    timestamp: new Date(Date.now() - 132 * 24 * 60 * 60_000).toISOString(),
    title: "Position opened",
    detail: "5 BNB deposited, $1,925 USDT borrowed",
  },
];

export const trustMetrics = {
  totalSpreadCaptured: 412_580,
  activePositions: 1284,
  collateralLocked: 4_120_000,
  auditedBy: "OtterSec",
};

export const comparisonRows = [
  { label: "Monitor Health Factor", equinox: "Agent", competitors: "You" },
  { label: "Pay monthly interest", equinox: "Agent (via spread)", competitors: "You" },
  { label: "Find best yield vault", equinox: "Agent (autonomous)", competitors: "Manual" },
  { label: "Rebalance allocations", equinox: "On 0.5% APR delta", competitors: "Manual" },
  { label: "Liquidation defense", equinox: "Automatic at HF 1.3", competitors: "You" },
  { label: "Required action from user", equinox: "Deposit. Done.", competitors: "Daily" },
];

export const riskProfiles = [
  {
    id: "conservative" as RiskProfile,
    label: "Conservative",
    glyph: "01",
    ltv: 0.4,
    apyMin: 3.1,
    apyMax: 4.4,
    liquidationDrop: 0.62,
    listaSplit: 0.7,
    pancakeSplit: 0.3,
    blurb: "Defensive LTV. Liquidation only on severe drawdowns.",
  },
  {
    id: "balanced" as RiskProfile,
    label: "Balanced",
    glyph: "02",
    ltv: 0.55,
    apyMin: 5.2,
    apyMax: 7.8,
    liquidationDrop: 0.42,
    listaSplit: 0.6,
    pancakeSplit: 0.4,
    blurb: "Recommended for most. Healthy spread, comfortable buffer.",
  },
  {
    id: "aggressive" as RiskProfile,
    label: "Aggressive",
    glyph: "03",
    ltv: 0.7,
    apyMin: 8.4,
    apyMax: 12.6,
    liquidationDrop: 0.22,
    listaSplit: 0.5,
    pancakeSplit: 0.5,
    blurb: "Maximum yield. Requires confidence in BNB conviction.",
  },
];
