# Flowroll — BNB Chain migration

Flowroll used to run on **Initia**: MiniEVM rollup `evm-1` plus a local `flowroll-4` appchain, InterwovenKit wallet, Cosmos `MsgCall` transactions, `.init` usernames, the Interwoven bridge and Auto-Sign. It now targets **BNB Smart Chain**:

| | BSC testnet (default) | BSC mainnet |
| - | - | - |
| chainId | 97 | 56 |
| RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` | `https://bsc-dataseed.bnbchain.org` |
| Explorer | https://testnet.bscscan.com | https://bscscan.com |
| Gas | tBNB ([faucet](https://www.bnbchain.org/en/testnet-faucet)) | BNB |

## flowroll-contract
- **No contract logic changes.** The contracts were already plain Solidity and are decimal-agnostic.
- `MockUSDC` now uses **18 decimals** to match Binance-Peg USDC/USDT on BSC. It used 6 before.
- Deploy and wire amounts changed from `e6` to `e18`.
- `.env.example`: `INITIAL_TVL` is now 1M × 1e18.
- `seed.sh` and `simulate-yield.sh` do big-number math with `bc`, because bash 64-bit arithmetic overflows at 18 decimals.
- `script/Deploy.s.sol`:
  - The mock "bridged INIT" is now `MockERC20("Mock Wrapped BNB", "mWBNB", 18)`, printed as `ONBOARDING_TOKEN_ADDRESS`. The zapper ABI keeps the `bridgedInit` name.
  - `GAS_PER_INIT` = 1.
  - Pool name is "BNB-Linked Vault".
  - The network label reads BSC Testnet.
- `foundry.toml`: `bsc_testnet`, `testnet` (alias) and `bsc` RPC endpoints, plus BscScan `[etherscan]` entries (`BSCSCAN_API_KEY`). The Initia endpoints are removed.
- Doc comments in `FlowrollZapper`, `IPool` (InitiaDEX → Venus / PancakeSwap adapter TODO) and the adapters are updated for 18 decimals.
- Off-chain agent (`scripts/agent`):
  - `INITIA_EVM_RPC` is now `BSC_RPC_URL`, defaulting to BSC testnet.
  - The balance log says BNB.
  - Event discovery scans at most `MAX_LOG_RANGE` (5000) blocks per tick.
  - The stale Initia `agent-state.json` / `agent.log` were removed, so the agent starts fresh from `DEPLOYMENT_BLOCK`.
- Deleted `scripts/testICosmos.ts` (it tested the Initia Cosmos precompile `0x…f1`) and its npm scripts.
- README is updated for BSC deploy.

## flowroll-frontend
- **Wallet / tx layer:**
  - `@initia/interwovenkit-react`, `@initia/*`, `@cosmjs/*`, `cosmjs-types` and `bech32-converting` are removed.
  - `providers.tsx` is now plain wagmi with the `injected()` connector on the viem `bscTestnet` / `bsc` chain.
  - The new `hooks/useEvmTx.ts` (`sendTx`) replaces `estimateGas` + `submitTxBlock(MsgCall)`: wagmi `writeContract`, then wait for the receipt, switching chain first if needed.
  - Every action hook uses it: payroll, credit, vault, token, onboarding.
- **Chain config:** `lib/interwoven.ts` was replaced by `lib/chain.ts`. It holds:
  - `ACTIVE_CHAIN` (`NEXT_PUBLIC_CHAIN_ID`, 97 default) and `NEXT_PUBLIC_BSC_RPC_URL`
  - `NATIVE_SYMBOL`, `USDC_DECIMALS = 18`
  - BscScan `explorerTx` / `explorerAddress`
  - `getLogsChunked`, which pages `eth_getLogs` by `NEXT_PUBLIC_LOGS_CHUNK`. It is used by the payroll, vault and router queries.
- **Addresses:** `lib/contracts/addresses.ts` is env-driven (`NEXT_PUBLIC_*_ADDRESS`, `NEXT_PUBLIC_DEPLOYMENT_BLOCK`). The Initia addresses are dropped. Chain keys are 97 / 56 / 31337.
- **Decimals:** every USDC `formatUnits` / `parseUnits` / `formatMoney(…, 6)` call now uses `USDC_DECIMALS` (18).
- **Onboarding:** the flow is now connect → claim tBNB → claim test USDC.
  - Removed the Initia bridge, zap and Auto-Sign steps, plus `AutoSignToggle` and the `mock-bridge` route.
  - The faucet link points to the BNB testnet faucet.
  - `NetworkSwitcher` is now a single "switch to BSC" button.
- **Identity:**
  - `.init` username resolution is removed: the `resolve-init`, `resolve-address` and `convert-address` API routes are gone, and the resolver hooks are no-ops. Employees are added by 0x address.
  - `useIdentity` uses wagmi. The display name is a truncated address.
- **Security fix:** the faucet key was `NEXT_PUBLIC_FAUCET_PRIVATE_KEY`, which put it in the browser bundle. It is now the server-only `FAUCET_PRIVATE_KEY`. Faucet routes reject other chainIds, and the tBNB drip is `FAUCET_NATIVE_AMOUNT` (default 0.005).
- Added `.env.example`. The README, layout metadata and a banner on the Initia-era `BUIDL.md` are rebranded.
- Small fix: the `/employee` page crashed at prerender on an undefined `totalLocked`. It now falls back to `0n`.

## TODO
1. Deploy to BSC testnet from `flowroll-contract/`. Run `forge install` first; the `lib/` submodules are empty in this copy.
   ```bash
   cp .env.example .env   # NETWORK=testnet, TESTNET_PRIVATE_KEY, AGENT_OPERATOR, FEE_RECIPIENT
   source .env
   forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast   # add --verify --etherscan-api-key $BSCSCAN_API_KEY
   # paste printed addresses into .env, then:
   ./scripts/sh/wire.sh && ./scripts/sh/seed.sh
   ```
   `seed.sh` funds the Zapper with 4 native tokens (`cast to-wei 4`). That is 4 tBNB, so lower it if the faucet balance is tight.
2. Copy the addresses and deploy block into the frontend `.env.local`: `NEXT_PUBLIC_*`.
3. Copy `YIELD_ROUTER_ADDRESS`, `DEPLOYMENT_BLOCK` and `BSC_RPC_URL` into `scripts/agent/.env`.
4. Fund the faucet wallet with tBNB and MockUSDC. Only the MockUSDC owner can `mint`; the claim route uses `transfer`.
5. Mainnet (56): the pools are still `MockPool`. Write a real adapter (e.g. Venus / PancakeSwap) and use real 18-decimal USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` or USDT `0x55d398326f99059fF775485246999027B3197955` instead of MockUSDC.
6. Optional:
   - Space ID `.bnb` name resolution in `useAddressResolver` / `useInitResolver`
   - a real bridge in `OmnichainBridge` (still "coming soon")
   - WalletConnect / RainbowKit if mobile wallets are needed
7. Leftovers kept as history: `broadcast/` folders for the Initia chainIds, `notes.md`, `anvil.md`, `wire_debug.txt`, and `package-lock.json` in the frontend, which is stale. `pnpm-lock.yaml` was regenerated. Run `npm install` to refresh `package-lock.json` if you use npm.

## Verification
- Contracts: the `lib/` submodules are empty here, so the check ran on a scratch copy linked to forge-std and OZ 5.1. `forge test` passed 262 of 262 tests with the 18-decimal MockUSDC.
- Frontend: `pnpm install` ran, `tsc --noEmit` is clean and `next build` succeeds (all 10 routes prerender).
- Agent: no type check was run. The only changes are env var names and the range cap.
