// Flowroll contract addresses per chain (BNB Chain migration).
//
// TODO(bnb): contracts are not yet deployed to BSC. After running
// `forge script script/Deploy.s.sol` + `WireContract.s.sol` against BSC testnet
// (see flowroll-contract/README / MIGRATION-BNB.md), set the NEXT_PUBLIC_*
// env vars below (or paste the addresses in here). Unset = zero address.
// The previous Initia (evm-1 / flowroll-4 appchain) deployments were dropped.

export const CHAINS = {
  LOCAL: "31337", // anvil
  BSC_TESTNET: "97",
  BSC: "56",
} as const;

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const env = (v: string | undefined) => ((v && v.trim()) || ZERO) as `0x${string}`;

// Next.js only inlines NEXT_PUBLIC_* when referenced literally, so each var is
// spelled out. The same set is used for whichever chain NEXT_PUBLIC_CHAIN_ID
// selects (97 by default).
const FROM_ENV = {
  PAYROLL_MANAGER_ADDRESS: env(process.env.NEXT_PUBLIC_PAYROLL_MANAGER_ADDRESS),
  PAYROLL_MANAGER_DEPLOYMENT_BLOCK: BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK?.trim() || "0"),
  USDC_ADDRESS: env(process.env.NEXT_PUBLIC_USDC_ADDRESS),
  YIELD_ROUTER_ADDRESS: env(process.env.NEXT_PUBLIC_YIELD_ROUTER_ADDRESS),
  PAY_VAULT_ADDRESS: env(process.env.NEXT_PUBLIC_PAY_VAULT_ADDRESS),
  PAYROLL_DISPATCHER_ADDRESS: env(process.env.NEXT_PUBLIC_PAYROLL_DISPATCHER_ADDRESS),
  FLOWROLL_ZAPPER_ADDRESS: env(process.env.NEXT_PUBLIC_FLOWROLL_ZAPPER_ADDRESS),
  FLOWROLL_CREDIT_ADDRESS: env(process.env.NEXT_PUBLIC_FLOWROLL_CREDIT_ADDRESS),
  // Mock onboarding token the FlowrollZapper accepts (was bridged INIT on Initia).
  BRIDGED_INIT_ADDRESS: env(process.env.NEXT_PUBLIC_ONBOARDING_TOKEN_ADDRESS),
  STABLE_POOL_ADDRESS: env(process.env.NEXT_PUBLIC_STABLE_POOL_ADDRESS),
  VOLATILE_POOL_ADDRESS: env(process.env.NEXT_PUBLIC_VOLATILE_POOL_ADDRESS),
  STABLE_ADAPTER_ADDRESS: env(process.env.NEXT_PUBLIC_STABLE_ADAPTER_ADDRESS),
  VOLATILE_ADAPTER_ADDRESS: env(process.env.NEXT_PUBLIC_VOLATILE_ADAPTER_ADDRESS),
};

export const CONTRACT_REGISTRY = {
  [CHAINS.LOCAL]: FROM_ENV,
  [CHAINS.BSC_TESTNET]: FROM_ENV,
  [CHAINS.BSC]: FROM_ENV,
} as const;

export function getContractsForChain(chainId: string) {
  const contracts = CONTRACT_REGISTRY[chainId as keyof typeof CONTRACT_REGISTRY];
  if (!contracts) {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  return contracts;
}
