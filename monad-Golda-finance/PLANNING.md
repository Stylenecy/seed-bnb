# Development Plan and Concept Definition

This document outlines the step-by-step implementation phases for Golda Finance.

## Phase 1: Smart Contract Foundation (/Contracts)
Goal: Build and test the secure ERC-4626 vault.
1. Initialize Foundry project.
2. Draft GoldaVault.sol inheriting from standard ERC-4626.
3. Implement PancakeSwap V3 (Uniswap V3-compatible) TWAP logic (300 seconds) for totalAssets() calculation.
4. Override _withdraw for pro-rata distribution of assets.
5. Implement executeRebalance with 4-byte selector validation for LI.FI router safety.
6. Write unit tests for deposit, TWAP manipulation resistance, pro-rata withdraw, and unauthorized access.

## Phase 2: Backend & AI Engine (/FE)
Goal: Build the off-chain decision and routing logic.
1. Initialize Next.js App Router project.
2. Create API route for AI regime classification. Connect to LLM to parse macro/sentiment data and output standardized JSON.
3. Create API route for LI.FI quote fetching based on AI target allocation.
4. Set up Privy Server SDK to manage the Agent Wallet.
5. Implement execution flow: Cron trigger > AI Decision > LI.FI calldata > Privy Agent signing > BNB Chain (BSC) transaction broadcast.

## Phase 3: User Interface & Auth (/FE)
Goal: Build the dashboard for users.
1. Integrate Privy for user login (embedded wallets).
2. Build dashboard displaying total vault assets, current AI regime, and allocation split.
3. Implement deposit and pro-rata withdraw interfaces interacting directly with GoldaVault.sol.
4. Add transaction history log tracking AI rebalance actions and reasoning.

## Security Audit Checklist
* Verify TWAP interval logic against flash-loan vectors.
* Verify LI.FI selector whitelist against arbitrary call exploits.
* Verify Privy Agent policy permissions.