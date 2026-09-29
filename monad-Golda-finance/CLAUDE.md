# System Context
Task: Implement Golda Finance, an Autonomous Safe-Haven Agent on BNB Chain (BSC).
Architecture style: Lean Hybrid. AI logic runs off-chain. Custody and valuation run strictly on-chain. Execution uses a Privy Agent Wallet via LI.FI calldata.

## Technical Stack
* Frontend/Backend: Next.js (latest stable App Router), Tailwind CSS.
* Auth & Execution: Privy (User embedded wallets and Server-side Agent Wallets).
* Swap Routing: LI.FI SDK.
* Smart Contracts: Foundry, Solidity ^0.8.24, modified ERC-4626.
* Network: BNB Smart Chain (BSC Testnet chain ID 97 default, BSC Mainnet chain ID 56). Stablecoins on BSC use 18 decimals (USDT 0x55d398326f99059fF775485246999027B3197955).

## Strict Engineering Rules
1. Valuation: The vault must value PAXG using a PancakeSwap V3 (Uniswap V3-compatible) TWAP internal oracle. Do not use Chainlink.
2. TWAP Interval: Must be exactly 300 seconds (5 minutes). On BSC (~0.75-3s blocks) this spans ~100-400 blocks for manipulation resistance.
3. Withdrawal: Override the internal _withdraw function to enforce a pro-rata distribution of USDC and PAXG based on current vault holdings. No on-the-fly swaps during withdrawal.
4. Security: The executeRebalance function must validate the 4-byte function selector to ensure only allowed LI.FI swap selectors are executed.
5. AI Functionality: The Next.js AI backend must output structured JSON containing regime classification, action, target percentage, and reasoning based on unstructured data.