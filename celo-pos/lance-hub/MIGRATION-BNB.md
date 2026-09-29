# LanceHub: multichain expansion to BNB Chain

LanceHub stays **live on Celo mainnet** (proxy `0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2`,
verified on Celoscan). Nothing about that deployment, its addresses or its history
changed. This expansion adds **BNB Chain** (BSC testnet 97 as the default BSC target,
BSC mainnet 56) as a second chain.

## What was added

| File | Change |
|------|--------|
| `contracts/foundry.toml` | Added `bsc_testnet` / `bsc` RPC endpoints and Etherscan V2 verify entries (chainid 97/56) next to `celo`. |
| `contracts/script/DeployBsc.s.sol` | New BSC deploy script. The pool asset defaults to canonical WBNB for the chain (`0xbb4C…095c` mainnet, `0xae13…a7cd` testnet), which you can override with `POOL_ASSET`. `OWNER` defaults to the deployer, and `SEED_AMOUNT` defaults to 0.01 WBNB. |
| `contracts/.env.example` | New file. Celo and BSC RPCs, keys, and the optional BSC overrides. |
| `contracts/deployments/bsc-testnet.json` | Placeholder, with addresses marked `TODO_DEPLOY`. |
| `scripts/airdrop-lance.mjs` | Now takes a `CHAIN_ID` (default `42220`, Celo, so behavior is unchanged), plus `97`/`56` for BSC, `RPC_URL` and `LANCE_ADDRESS`. |
| `README.md`, `ECONOMY.md` | Added a "Now also on BNB Chain" section and note. All the Celo proof stays as it was. |

The contract sources (`src/`) and tests were not changed. `Deploy.s.sol` (Celo) was not changed either.

## Design notes

- Native BNB is not an ERC20, so on BSC the ERC-4626 asset is **WBNB** (18 decimals).
- `SEED_RATE` is a constant (1000 LANCE per unit of asset). On BSC, 1 LANCE therefore
  starts at 0.001 BNB, which is far more than 0.001 CELO. If you want LANCE to be as
  cheap on BSC, seed with a small amount, or change `SEED_RATE` in a new implementation
  (a contract change, which was left out on purpose).
- $LANCE on Celo and $LANCE on BSC are **separate tokens with separate pools**. There
  is no bridge.

## Deploy to BSC testnet (not done: no deploys were run)

```sh
cd contracts
cp .env.example .env    # fill DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY
# get tBNB: https://www.bnbchain.org/en/testnet-faucet ; wrap some to WBNB (WBNB.deposit)
source .env
forge script script/DeployBsc.s.sol --rpc-url bsc_testnet --broadcast --verify
```

Then record the proxy and implementation in `deployments/bsc-testnet.json`, and
`allowToken(<BSC LANCE>)` on the BSC deployments of BingoChain and Claudelance.

## TODO

- Deploy to BSC testnet, then mainnet, with a Safe owner on mainnet.
- Fill in the BSC LanceHub addresses in `deployments/`, in `airdrop-lance.mjs` (`CHAINS[97|56].lance`) and in the README table.
- Decide on the BSC seed amount and whether BSC needs a different `SEED_RATE`.

## Verification

`forge build` succeeded and `forge test` passed 13/13. `node --check scripts/airdrop-lance.mjs` passed.
