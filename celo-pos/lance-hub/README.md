# LanceHub: the $LANCE internal economy

**$LANCE** is the closed-loop credits token that powers the ecosystem. Games
(BingoChain and future games) are played and staked in $LANCE, and every
project's revenue flows back to one central **Token Hub** that backs it.

> Internal only. $LANCE is **not** listed on any DEX or CEX and its value is not
> market set. It is a transparent, fully backed credit, closer to a money-market
> share than a speculative token.

## How value works

LanceHub is an **ERC-4626 vault**: the asset is **CELO** held in the Redemption
Pool, and $LANCE is the vault share.

```
NAV (on-chain rate) = pool CELO / circulating $LANCE
```

It is bootstrapped cheap: a one-time `seed` mints 1000 $LANCE per CELO, so one
$LANCE starts at about 0.001 CELO (about $0.0003), cheap enough to hand out for
play and testing.

| Action | Effect |
|--------|--------|
| `deposit(CELO)` | mint $LANCE at the current NAV. Fair, dilutes no one. |
| `redeem($LANCE)` | CELO at NAV minus a small redeem fee; the fee stays in the pool, lifting NAV for everyone who stays (healthy friction). |
| `fundPool(CELO)` | revenue or backing in, without minting. NAV rises for all holders (the value engine). |
| Earn = `deposit(CELO, earner)` | a rewarder funds the reward in CELO and mints to the earner at NAV. NAV-neutral (keeps sink >= faucet). |

Guardrails baked in: never over-issue (every mint is backed at NAV),
sink >= faucet (redeem fee plus funded Earn), pool fully transparent on-chain.

## Live deployment (Celo mainnet, chain 42220)

| Component | Address |
|-----------|---------|
| LanceHub proxy (= $LANCE token, verified) | `0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2` |
| Implementation (verified) | `0x659acad7005c8E45f8590eecDF2ad928884A6Eb7` |
| Pool asset (CELO ERC20) | `0x471EcE3750Da237f93B8E339c536989b8978a438` |
| Owner (operator Safe, threshold 2) | `0xe9Fc48f315fD4E989637fAcC29AaF2717E19f7F0` |

Token: `Lance` / `LANCE`, 18 decimals. Redeem fee: 1% (`redeemFeeBps = 100`,
hard cap 5%). Seeded with 20 CELO at 1 CELO = 1000 LANCE, so the starting NAV is
0.001 CELO per $LANCE. Verified source on Celoscan:
<https://celoscan.io/address/0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2#code>

### Now also on BNB Chain (multichain expansion)

Live on Celo (above, unchanged), now also deployable on **BNB Chain**. On BSC the
pool asset is **WBNB** (native BNB is not an ERC20). Same contract source, same
1000 LANCE per unit seed rate, same 1% redeem fee.

| Component | BSC testnet (97, default) | BSC mainnet (56) |
|-----------|---------------------------|------------------|
| LanceHub proxy (= $LANCE) | [`0x56a647A62C68BF7228Cb0b876a937a7331a41bf9`](https://testnet.bscscan.com/address/0x56a647A62C68BF7228Cb0b876a937a7331a41bf9) | TODO |
| LanceHub implementation | [`0x278d0FbaD0C63335aa05163edA7abd673F2f4a41`](https://testnet.bscscan.com/address/0x278d0FbaD0C63335aa05163edA7abd673F2f4a41) | TODO |
| Pool asset (WBNB) | `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd` | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |

```sh
cd contracts && cp .env.example .env   # fill DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY
source .env && forge script script/DeployBsc.s.sol --rpc-url bsc_testnet --broadcast --verify
```

See [`MIGRATION-BNB.md`](./MIGRATION-BNB.md) for details and TODOs.

> $LANCE is what BingoChain and Claudelance `allowToken` against as a stake and
> payout currency. See [`ECONOMY.md`](./ECONOMY.md) for how the three projects
> share one economy.

## Architecture

- `src/LanceHub.sol` - ERC-4626 vault (CELO <-> $LANCE) with a one-time `seed`,
  a redeem fee, `fundPool`, and a `nav()` view. UUPS-upgradeable, `Ownable2Step`
  (Safe multisig owner), `Pausable` (pause gates deposit and withdraw only; plain
  $LANCE transfers stay live so games keep working), EIP-7201 namespaced storage.
- `src/LanceHubProxy.sol` - ERC-1967 proxy.
- `script/Deploy.s.sol` - deploys implementation plus proxy on Celo mainnet,
  owner = operator Safe.
- `script/DeployBsc.s.sol` - same deploy for BNB Chain (BSC testnet 97 / mainnet 56),
  asset = WBNB, owner = `OWNER` env (default deployer).

Why `seed`: deposits are gated until it runs once. The seed sets the cheap fixed
rate and mints the distributable supply, and that large minted supply neutralizes
the ERC-4626 inflation/donation attack, so no dead-shares trick is needed.

## Build and test

```sh
cd contracts
forge build
forge test
```

13 Foundry tests cover deposit-at-NAV, fundPool raises NAV, redeem-fee-lifts-NAV,
Earn NAV-neutral, withdraw-net, seed (cheap rate, one-shot), admin guards, pause,
and owner-gated upgrade. OpenZeppelin v5.0.2 and forge-std are git submodules, so
a fresh clone needs them fetched first:

```sh
git submodule update --init --recursive
```

## Reproduce the deploy (reference)

The Hub is already live; these are the steps it was deployed with.

1. `forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify`
2. Call `seed(assets)` once to set the rate, mint the distributable supply, and
   neutralize the inflation attack (done with 20 CELO).
3. Confirm `owner()` is the Safe, then route all future upgrades and fee changes
   through the Safe.

## Roadmap

- Wire game revenue into `fundPool` (BingoChain rake, Claudelance protocol fee)
  so NAV rises from real fees.
- Post and settle in $LANCE from the BingoChain and Claudelance UIs.
- Optional second value lever: a burn sink (hybrid), added later via a Safe upgrade.
- Frontend: deposit, redeem, live NAV, and Earn flows in each app's Profile.
- Security review plus invariant suite (pool >= obligations, NAV monotonic under
  fund and redeem-fee).
