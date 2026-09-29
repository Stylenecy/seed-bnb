# BINGOChain: BNB Chain verification

Date: 2026-09-25. Method: a local anvil fork of BSC testnet (chain 97) and anvil's public test accounts. Nothing was written to a real network.

**Verdict: works on the BSC fork. The Celo path is intact and is still the default.**

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | |
| `forge test` | PASS | 95/95 across 12 suites |
| Fork deploy (`script/Deploy.s.sol`) | PASS | Deployed the implementation and proxy on the fork; `version()` returns 1.3.0. On chain 97 the owner may equal the deployer. On 56 and 42220 the owner must not be the deployer. |
| Core flow | PASS | `allowToken(WBNB testnet, 0.001)`, then `createArena(WBNB, 2 players, 0.01)`, two `commitBoard` calls, 21 `callNumber` calls, `claimBingo`, both `revealBoard` calls and `settle`. The winner earned 0.0198 and the treasury 0.0002 (1% fee). `withdraw` then paid out WBNB. |
| LANCE on BSC | PASS | `allowToken(<fork LanceHub>)`, then a LANCE-staked arena was created and joined, and the stake was escrowed. |
| API / indexer (`apps/api`, CHAIN_ID=97) | PASS | Ran against the fork with a local Postgres. `/api/health` reports the database up. `/api/arenas`, `/api/arena/1` (players, winner and decoded revealed boards), `/api/stats`, `/api/leaderboard` and `/api/player/:addr` all returned correct data. New arenas were picked up live by polling. |
| API, Celo default (read-only) | PASS* | The default config indexes the live Celo proxy (47 games / 105 arenas seen). *This needs `INDEX_CHUNK<=5000`, because forno now rejects 9000-block `eth_getLogs`. That limit was already there before the migration: the default chunk is 9000 in the original as well. |
| Web typecheck | PASS | `tsc --noEmit` |
| Web build + run, Celo default | PASS | `next build`, then `next start` on :3100. `/`, `/arenas`, `/create`, `/profile`, `/arena/1` and `/how-to-play` return 200 with Celoscan links and no BscScan. |
| Web build + run, `NEXT_PUBLIC_CHAIN_ID=97` | PASS | The fork BingoChain and LANCE addresses are baked into the bundle. All pages return 200 with testnet.bscscan links, no Celoscan links and no chain-mismatch text. The OG images return 200. |
| Real-network address checks | PASS | On BSC mainnet: USDT `0x55d3…7955`, USDC `0x8AC7…580d` and WBNB `0xbb4C…095c` all have 18 decimals. Testnet WBNB `0xae13…a7cd` has 18 decimals. The Celo proxy `0x8bE7…32f1` is live (v1.3.0, Safe owner). Celo cUSD has 18 decimals; USDC and USDT have 6. |

## Bugs fixed
- `apps/api/src/indexer.ts`: on BSC, with no `BINGO_ADDRESS` set, the indexer silently indexed the zero address. With no `INDEX_START_BLOCK`, it scanned from genesis, about 15k RPC calls. It now fails fast on 97/56 when either variable is missing. Celo behavior is unchanged: it still uses the built-in proxy and start block.
- `apps/api/src/indexer.ts` and `.env.example`: the default BSC testnet RPC is now `https://bsc-testnet-rpc.publicnode.com`. The old default, `data-seed-prebsc-1-s1.bnbchain.org`, rejects every `eth_getLogs` call with "limit exceeded", so the indexer could never index. The BSC mainnet default (`bsc-dataseed`) has the same problem. On 56, set `RPC_URL` to a provider that supports `eth_getLogs` / archive queries.

## Notes
- `apps/api` only turns TLS off for `*.railway.internal` URLs, so a local Postgres without SSL needs a URL that contains `railway.internal`. This was already there before the migration. For local runs, add `?application_name=railway.internal`.
- The web copy (title, meta) is still Celo-first on a BSC build. The BSC build only changes addresses and links. This is cosmetic.
- On the fork, anvil's default accounts carry EIP-7702 delegation code on real BSC testnet. That is a fork artifact, not a project bug.

## Steps remaining for a real BSC testnet deploy
1. Fund the deployer with about 0.05 tBNB. The proxy and implementation cost roughly 5M gas, about 0.005 tBNB at 1 gwei.
2. Set `OWNER_ADDRESS`, `TREASURY_ADDRESS`, `PROTOCOL_FEE_BPS=100`, `BSC_TESTNET_RPC` and `ETHERSCAN_API_KEY`.
3. Run `forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast --verify --private-key $DEPLOYER_PRIVATE_KEY`.
4. As owner, call `allowToken` for WBNB (`0xae13…a7cd`, min 0.001), a MockERC20 USDT (18 decimals) and the BSC LANCE (from lance-hub `DeployBsc.s.sol`).
5. Fill in `deployments/bsc-testnet.json`.
6. For the web, set `NEXT_PUBLIC_CHAIN_ID=97`, `NEXT_PUBLIC_BSC_TESTNET_BINGO_ADDRESS`, `_LANCE_ADDRESS`, `_USDT_ADDRESS` and `NEXT_PUBLIC_API_URL`, and deploy it as a separate build.
7. For the API, run a separate instance and database with `CHAIN_ID=97`, `BINGO_ADDRESS`, `INDEX_START_BLOCK` (the proxy's deploy block) and `RPC_URL=https://bsc-testnet-rpc.publicnode.com`. The bnbchain.org data-seed RPC rejects `eth_getLogs`. Keep `INDEX_CHUNK` at 50000 or less.

## Real BSC Testnet deploy (2026-09-25)

Deployed on the real BSC testnet (chain 97) with `script/Deploy.s.sol` (`--rpc-url bsc_testnet`, RPC `https://bsc-testnet-rpc.publicnode.com`, gas price 0.1 gwei). The owner and treasury are both the group wallet `0x3F46b654035aA92738FE4dC7dc9538Ca9bA07CEA` (owner == deployer is allowed on 97). The fee is 100 bps. The contracts are **not verified** on BscScan, because no `ETHERSCAN_API_KEY` was available.

| Contract | Address |
|---|---|
| BingoChain proxy | [`0x501125227641B73061B1EDAf1a60CbF56701d110`](https://testnet.bscscan.com/address/0x501125227641B73061B1EDAf1a60CbF56701d110) |
| BingoChain implementation (`version()` = 1.3.0) | [`0x6Bc43092780Ab107c8E4976d8E39733Ae01508Cb`](https://testnet.bscscan.com/address/0x6Bc43092780Ab107c8E4976d8E39733Ae01508Cb) |
| $LANCE (lance-hub BSC testnet deploy) | [`0x56a647A62C68BF7228Cb0b876a937a7331a41bf9`](https://testnet.bscscan.com/address/0x56a647A62C68BF7228Cb0b876a937a7331a41bf9) |

Deploy block: 132984340.

Deploy transactions:
- Implementation: [`0xe6c9b297…`](https://testnet.bscscan.com/tx/0xe6c9b297715f784f067c44b2868a96457668931dea0ae5a19e5f06ab5156789b)
- Proxy and initialize: [`0xc0703ad1…`](https://testnet.bscscan.com/tx/0xc0703ad1c66f405330f93bf5a60b519a875e2d7f107c84490980f33d3d124635)

Token whitelist:
- `allowToken(WBNB, 0.001)`: [`0x3f60807f…`](https://testnet.bscscan.com/tx/0x3f60807f216769c85153aaa26e54ff58f92af6f42929b1fb462b2de7ac3b57b7)
- `allowToken(LANCE, 10)`: [`0xa74de6ed…`](https://testnet.bscscan.com/tx/0xa74de6ed2ec839b5dcccee2a85515d6a2f4f646b9537faae5987db584231f409). The minimum of 10 matches the web UI.

No USDT MockERC20 was deployed, because this repo has none. `NEXT_PUBLIC_BSC_TESTNET_USDT_ADDRESS` is left empty, so the UI hides USDT.

Smoke flow on the real testnet: one full 2-player WBNB game, run with cast. Player 1 is the group wallet. Player 2 is a new wallet `0x090c9E1c284b1789709f7f2EFf5A63bd31B9D8c7`, funded with 0.003 tBNB ([`0xf4316b23…`](https://testnet.bscscan.com/tx/0xf4316b2332c4489916df611e13de99dd89253498c47a59ddd8eac414cc606572)). Every receipt has status 1.

| Step | Tx |
|---|---|
| createArena(WBNB, 2 players, 0.001) → arena 1 | [`0x7480b034…`](https://testnet.bscscan.com/tx/0x7480b034963077523f94d3a7802f3644d7f34af06c6073568227c911630c4bc6) |
| commitBoard P1 / P2 (stakes escrowed) | [`0xe1b09ed2…`](https://testnet.bscscan.com/tx/0xe1b09ed237ebc3ded90cd3f67321f689337de321203c9f6450588bb8c96c5d23) / [`0xeca91a0c…`](https://testnet.bscscan.com/tx/0xeca91a0ce44ad325caa13ada6737e4616105829e2235f46e93b858d927d4a173) |
| callNumber 1..5, alternating turns | [`0xa26954e2…`](https://testnet.bscscan.com/tx/0xa26954e276b9fcf916425dbf4a46499c8499951af70370196687127d3e5b2181), [`0xa69feb47…`](https://testnet.bscscan.com/tx/0xa69feb476de119a3752dca6e415481d422fa107a03b6ab4dd39a175d0e9d6806), [`0x13c8100f…`](https://testnet.bscscan.com/tx/0x13c8100f5d7d2a1302ef05ad9021692578b59ccf0cff1e1c36e05f1b1d834783), [`0x82f526e9…`](https://testnet.bscscan.com/tx/0x82f526e9af97e3ec958e3620cbfe4d0808ab42a49d44383efa448083c11e8014), [`0x1bff8ddb…`](https://testnet.bscscan.com/tx/0x1bff8ddbc79038db0a8155524b89443642207ba3e4001a8556532c144af8f4df) |
| claimBingo | [`0xe39caff2…`](https://testnet.bscscan.com/tx/0xe39caff22042ded099088d19b7c6d75449687ce0d950a0e4b3fb56ebf647a72e) |
| revealBoard P1 / P2 | [`0xd50990f4…`](https://testnet.bscscan.com/tx/0xd50990f4ed3e136ce2dd00b1be5baf6657080419ec8967a2c90cd72a05383259) / [`0xae74f0c2…`](https://testnet.bscscan.com/tx/0xae74f0c25215b4d85ced4c0c7d2a1700f7131edce6e6610d360cc104e4b0b6ac) |
| settle | [`0xb5b11ace…`](https://testnet.bscscan.com/tx/0xb5b11ace179c9bf4abbe8b6586ce02ceecc514544a0549fe0f150af52401e6b4) |
| withdraw(WBNB) P1 | [`0x67948247…`](https://testnet.bscscan.com/tx/0x67948247fb0d5084379b222d8238532c9ad3fa99c3bbe7b6681447dd60fd7d64) |

Result: both boards completed a line on the same call sequence (1..5), so the game settled as a two-way tie. Each winner earned 0.00099 WBNB, and the treasury (P1) took the 0.00002 fee, so P1's earnings were 0.00101. P1 withdrew 0.00101 WBNB. P2's 0.00099 WBNB is still claimable in the contract.

Gas spent: about 0.00057 tBNB in total (group wallet about 0.000525, P2 about 0.000045). In addition, 0.003 tBNB was sent to P2, which still holds about 0.00195 tBNB.

Web, built with `NEXT_PUBLIC_CHAIN_ID=97` from the values in `apps/web/.env.bsc-testnet`: `next build` passed. `next start` ran on :3100, where `/`, `/arenas`, `/create`, `/profile`, `/arena/1`, `/how-to-play` and `/opengraph-image` all returned 200. The page links point to `testnet.bscscan.com/address/0x5011…d110` and the LANCE token, with 0 Celoscan links, and the proxy address is in the static bundle. The server was stopped afterwards, and `node_modules` and `.next` were removed. The Celo default config was not touched.

**Works live:** deploy, allowToken, and a full game: create, commit, call, claim, reveal, settle with the fee, and withdraw.

**Left to do:**
- BscScan verification (needs an API key).
- A USDT mock, if a USDT arena is wanted.
- The API indexer was not run against the testnet (it needs its own Postgres). `apps/api/.env.bsc-testnet` has `CHAIN_ID`, `BINGO_ADDRESS` and `INDEX_START_BLOCK`.
- No LANCE-staked arena was played live. It would need 10 LANCE per player, which is about 0.0117 WBNB each.
