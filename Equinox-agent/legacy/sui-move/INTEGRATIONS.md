# DeFi venue integration notes (Scallop, Navi)

## Both are MAINNET-ONLY on Sui

Scallop and Navi are **not deployed on Sui testnet**, only mainnet. (Scallop's
SDK explicitly errors on testnet: "no address package ID for the testnet".) So:

- **Testnet demos can only use the native venue** (Equinox's own pool). The
  venue-selection UX still works, `native-*` venues are selectable.
- **Real Scallop/Navi wiring runs on mainnet** (real funds + gas). The adapter
  code can be *built/compiled* against their interfaces ahead of time (vendored
  interface, like we did for Pyth), but *executing* it needs mainnet.

Both protocols fit Equinox's generic-custody model: the vault custodies the
returned position object (`P: key + store`), a Scallop `MarketCoin`/Obligation
or a Navi `AccountCap`, and the real call is composed in the PTB.

---

## Scallop (mainnet)

Cleaner first integration, supply/redeem return composable coins.

| | id |
|--|--|
| Protocol package | `0x578374a1f5182013268bbe9b2b080c5d14cbed1a48f9990c5f8a1c33bf100e69` |
| Market (shared) | `0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9` |
| Version (shared) | `0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7` |
| CoinDecimals registry | `0x200abe9bf19751cc566ae35aa58e2b7e4ff688fc1130f8d8909ea09bc137d668` |

**Lend leg (supply for yield), fits our model directly:**
```move
// supply: returns a yield-bearing coin (key+store) the vault custodies
<pkg>::mint::mint<T>(version: &Version, market: &mut Market, coin: Coin<T>, clock: &Clock, ctx)
    : Coin<MarketCoin<T>>
// withdraw:
<pkg>::redeem::redeem<T>(version: &Version, market: &mut Market, sc: Coin<MarketCoin<T>>, clock, ctx)
    : Coin<T>
```
PTB recipe: `vault::enter_strategy<C> -> mint -> vault::record_position<.., Coin<MarketCoin<T>>> -> settle`.

**Borrow leg** uses an **Obligation** (CDP object) + ObligationKey: open obligation,
add collateral, borrow against it. Get the exact `borrow`/`open_obligation`
signatures from the Move source (see "how to verify", not in the lending-function
doc). The vault would custody the Obligation + key.

---

## Navi (mainnet)

Account-based; uses **entry** functions (auto-handle coins) OR `*_with_account_cap`
non-entry variants that return `Balance<T>` (composable, use these).

| | id |
|--|--|
| Lending package (2026-02-11) | `0x1e4a13a0494d5facdbe8473e74127b838c2d446ecec0ce262e2eddafa77259cb` |
| Oracle package | `0x203728f46eb10d19f8f8081db849c86aa8f2a19341b7fd84d7a0e74f053f6242` |
| PriceOracle (shared) | `0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef` |
| Storage / Pool<T> / IncentiveV2 / Incentive(v3) | per-asset, fetch via API `/api/navi/pools` or SDK `getLatestProtocolPackageId()` |

```move
// composable withdraw (returns Balance, not auto-transfer):
<pkg>::lending::withdraw_with_account_cap_v2<T>(
  clock, oracle: &PriceOracle, storage: &mut Storage, pool: &mut Pool<T>, asset: u8,
  amount: u64, incentive_v2: &mut IncentiveV2, incentive_v3: &mut Incentive,
  account_cap: &AccountCap, system_state: &mut SuiSystemState, ctx) : Balance<T>
// entry deposit (auto-handles the coin):
<pkg>::lending::entry_deposit<T>(clock, storage, pool, asset: u8, coin, amount,
  incentive_v2, incentive_v3, ctx)
```
The **AccountCap** is the position handle the vault custodies. Navi needs many
shared objects (storage, pool, 2× incentive, oracle, `0x5` SuiSystemState), heavier
to compose than Scallop. `asset: u8` is a per-asset numeric id (from their pools API).

---

## How to find / verify these yourself

1. **Explorers**, paste a package id into [suivision.xyz](https://suivision.xyz)
   or [suiscan.xyz](https://suiscan.xyz): browse its modules → functions (exact
   signatures), and find shared objects it owns/created.
2. **Scallop**, docs.scallop.io → *Integrations* (Package Addresses + Contract
   Integration). Live addresses JSON: `https://sui.apis.scallop.io/addresses/<id>`.
   Move source (for borrow/obligation): github.com/scallop-io/sui-lending-protocol.
3. **Navi**, naviprotocol.gitbook.io developer docs → *Contract Configuration*
   ("Get the Latest Package ID", "Get Pools Config"). Full export:
   `…/navi-protocol-developer-docs/llms-full.txt`. Source/config: github.com/naviprotocol
   (navi-sdk address constants, navi-smart-contracts). Pools API: `/api/navi/pools`.
4. **On-chain (ground truth)**, once you have a package id, inside the toolchain
   container:
   ```bash
   sui client switch --env mainnet
   sui client object <PACKAGE_ID> --json          # linkage / deps
   # exact function signatures via RPC:
   curl -s https://fullnode.mainnet.sui.io:443 -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","id":1,"method":"sui_getNormalizedMoveModulesByPackage","params":["<PACKAGE_ID>"]}' | jq
   ```
   The TS SDK source files are the most reliable source for the current object ids
   (they hardcode/fetch them), package ids change on upgrades, so always re-verify.

> **Recommendation:** Scallop first (clean `mint`/`redeem` → composable coins),
> Navi second (account-cap + heavier object set). Decide testnet (native only) vs
> mainnet (real Scallop/Navi) before wiring, see top of this file.

---

## Testnet venue strategy (many choices without mainnet protocols)

Real Sui **lending** protocols (Scallop, Navi, Suilend, Bucket, Kai) are all
**mainnet-only**, so on testnet there is no external protocol to *borrow* from.
The plan to still give users many selectable venues on testnet:

1. **Multiple native venues (the backbone).** `native_pool` is generic, and the
   registry holds any number of named venues. Spin up one pool per asset/role and
   register them, e.g. `native-usdc`, `native-sui`, `native-btc`, `native-eth`
   for lend, plus borrow-side native pools. This gives a rich "pick your DeFi /
   pick your vault" list, all real and working, with zero external dependency.
2. **Real external LP venues that DO have testnet (optional showcase):**
   - **DeepBook** (Mysten's native CLOB), on testnet; usable as a *lend/LP*
     (market-making) venue, not a borrow venue. Verify the current testnet package
     id in the Sui/DeepBook docs (it changes).
   - **Cetus** (concentrated-liquidity AMM), maintains live testnet addresses in
     its developer docs; an *LP* venue, not lending.
   These are LP/trading venues (deploy liquidity), not collateralized borrowing,
   good for the lend leg, not the borrow leg.

So: **borrow venues on testnet = native only; lend/LP venues = native + optionally
DeepBook/Cetus.** The borrow→lend carry trade is fully demoable on testnet using
two different native venues (borrow from one, lend to another).

## Mainnet design readiness

The core needs no changes to support Scallop/Navi on mainnet. The model already
fits:
- The vault custodies the venue's returned position generically
  (`record_position<C, Q, P: key + store>`): a `Coin<MarketCoin<T>>` (Scallop),
  an Obligation (Scallop borrow), or an `AccountCap` (Navi) all qualify.
- Venue selection + risk params live in `registry`; the agent stores the user's
  `borrow_venue` / `lend_venue`.
- The real protocol call is composed in the PTB (recipes above), so the core has
  no compile-time dependency on them.

Remaining build work for mainnet (deploy-time, not design): (a) a Q-deploy hook
to lend the borrowed proceeds to a venue, (b) an external-borrow hook custodying
the Obligation/AccountCap, (c) vendored read interfaces if any on-chain reads are
needed (same technique as `vendor/pyth`).
