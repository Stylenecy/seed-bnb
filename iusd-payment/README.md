# iUSD Pay — private stablecoin payments & gifts on BNB Chain

| | |
|---|---|
| **Chain** | BNB Smart Chain (testnet `97` default, mainnet `56`) |
| **Settlement token** | USDT (ERC-20, 18 decimals on BSC) |
| **Contracts** | [`packages/contracts/foundry`](packages/contracts/foundry) (Solidity, Foundry, OpenZeppelin) |
| **Migration notes** | [`MIGRATION-BNB.md`](MIGRATION-BNB.md) |

### TL;DR

iUSD Pay is a privacy-preserving consumer payments app on BNB Chain. It gives
stablecoin users a Venmo-grade phone-browser experience — **send**, **request
via QR / invoice**, and **share on-chain gift packets** — with cryptographic
privacy on amount, sender, recipient, and memo.

> Originally built on Initia (Move). This repository is the BNB Chain port:
> the Move modules were rewritten in Solidity and the app talks to BSC through
> viem / ethers and any injected wallet. See [`MIGRATION-BNB.md`](MIGRATION-BNB.md).

### Quickstart (BSC testnet)

```bash
# 1. Contracts: deploys MockERC20 "USDT" + IPayPool + IPayGiftPool to chain 97
cd packages/contracts/foundry && forge test
DEPLOYER_PK=0x... RELAYER_ADDRESS=0x... \
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
  bash ../../../scripts/deploy/bsc-deploy.sh testnet

# 2. Load the gift box catalog
GIFT_POOL_ADDRESS=0x... DEPLOYER_PK=0x... \
BSC_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545 \
  bash scripts/deploy/bsc-register-gift-boxes.sh

# 3. Configure and run (copy each .env.example to .env and fill the addresses)
pnpm install
pnpm --filter @ipay/api dev      # API
pnpm --filter @ipay/app dev      # web app
```

Get test BNB from the [BNB Chain faucet](https://www.bnbchain.org/en/testnet-faucet);
mint test USDT with `MockERC20.mint(address,uint256)`.

### Deployments

**BSC Testnet (chainId 97)**, deployed 2026-09-25 with `PAY_FEE_BPS=50` (0.5%) and `PAY_FEE_CAP=5 USDT`, 24 gift boxes registered:

| Contract | Address |
|---|---|
| MockERC20 "USDT" (18 dec) | [`0x4DC7AaB064D301711573c636b08c2B7F7BD2133E`](https://testnet.bscscan.com/address/0x4DC7AaB064D301711573c636b08c2B7F7BD2133E) |
| IPayPool | [`0xa2AeEaA76FCE9D4B0dE56CF58449403cA5DFA34F`](https://testnet.bscscan.com/address/0xa2AeEaA76FCE9D4B0dE56CF58449403cA5DFA34F) |
| IPayGiftPool | [`0xe17b45A76a7013cE1a0Ff9960287A7b076C02aD3`](https://testnet.bscscan.com/address/0xe17b45A76a7013cE1a0Ff9960287A7b076C02aD3) |
| Relayer (sponsor on both pools) | [`0xA23C8C58e9Fe85Aa4b7D0398A49cf2b59b54C46A`](https://testnet.bscscan.com/address/0xA23C8C58e9Fe85Aa4b7D0398A49cf2b59b54C46A) |

Addresses are also in `deployments/bsc-testnet.json` and `packages/{api,app,admin}/.env.bsc-testnet`
(frontends: `vite build --mode bsc-testnet`). The contracts are not verified on BscScan yet.

---

## 1. Originality & Track Fit

**The problem.** Crypto payments today are either (a) fully public — every
amount, counterparty, and memo visible on the explorer, which is a dealbreaker
for day-to-day consumer use — or (b) locked inside custodial apps that defeat
the point of being on-chain in the first place. Venmo has 80M+ users because
it just *works*. No on-chain equivalent has shipped a UX that matches.

**Our point of view.** The gap isn't "add complex cryptography for the sake of it". It's a
**product gap**: the primitives (on-chain payments, stablecoins, bridges,
privacy) already exist. What's missing is a consumer app that treats privacy,
cross-chain delivery, and gas sponsorship as invisible plumbing, and puts
social primitives (**gifts**, **red envelopes**, **thank-you notes**) on top
so the UX actually feels good.

**What's distinct about iUSD Pay:**

- **Dual-recipient ECIES envelopes.** Every on-chain payment carries an
  AES-256-GCM ciphertext wrapped for *two* viewers — the recipient's viewing
  key **and** an admin audit key. Compliance-ready privacy, not yolo privacy.
- **Gift packets as a new social channel.** Not just "transfer + memo" but
  an on-chain object that unlocks a whole category of social interaction
  that wallets simply don't support: wrap + unwrap animations, mystery-box
  share previews, group red-envelopes (equal or random), thank-you letters,
  public reactions, encrypted sponsor-to-claimer chat — all layered on the
  same stablecoin payment rail. **iUSD Pay turns stablecoin payments into a
  social network, not a spreadsheet.** (See §3 for the deep dive.)
- **Venmo-speed from a phone browser.** No app install, QR-first, three-step
  send flow, PWA-installable. Every flow is built to be one tap from a phone.
- **Wallet-native flows.** Claim, refund, gift wrap, gift open, reply — one
  wallet confirmation each (plus a one-time token approval) with any BNB Chain
  wallet: MetaMask, Trust Wallet, Binance Web3 Wallet.

**Track.** DeFi (payments + stablecoins).

---


## 2. Technical Execution

### 2.1 Solidity contracts on BNB Smart Chain

Two contracts in [`packages/contracts/foundry/src/`](packages/contracts/foundry/src/), ported
1:1 from the original Move modules (kept for reference in
[`packages/contracts/legacy/move/`](packages/contracts/legacy/move/)):

| Contract | Responsibility |
|---|---|
| [`IPayPool.sol`](packages/contracts/foundry/src/IPayPool.sol) | Deposit / claim / sponsor-claim / revoke / expire / refund. Per-payment ECIES envelopes. `sha256(plain)` payment-id hiding. Freeze registry for compliance. Fee in bps with a cap. |
| [`IPayGiftPool.sol`](packages/contracts/foundry/src/IPayGiftPool.sol) | Gift packets: direct (bearer claim key) or group red-envelope with Equal / Random split. Address-bound slot proofs against front-running. Admin-curated box catalog. Sponsor (relayer) allowlist. |

Settlement token is an ERC-20 stablecoin: **USDT on BSC mainnet**
(`0x55d398326f99059fF775485246999027B3197955`, 18 decimals) or a MockERC20 on
BSC testnet. Foundry tests: `cd packages/contracts/foundry && forge test`.

### 2.2 Privacy layer

Every on-chain payment stores an AES-256-GCM ciphertext whose symmetric key
is wrapped via ECIES (secp256k1) **twice** — once for the recipient's viewing
key, once for an admin audit key. The ciphertext covers sender, recipient,
amount, memo, and the claim key. The outside world sees only opaque bytes;
the payee and the admin can decrypt. Reference:
[`packages/api/src/services/security/encryption.ts`](packages/api/src/services/security/encryption.ts).

The admin viewing key is baked into every payload at build time
(`VITE_ADMIN_VIEWING_PK`) so compliance audit is always possible without
trusting the frontend to cooperate at write-time.

**This is not a theoretical claim** — the admin console in
[`packages/admin/`](packages/admin/) uses exactly this path to resolve the
plaintext sender, recipient, amount, and memo for any payment. Scene 4 of
the demo video shows it live: an auditor searches a payment ID and sees the
decrypted sender / recipient addresses + nicknames + amount, even
though those fields never appear in the transaction payload on chain.


### 2.5 Internationalization (i18n) — 19 locales, end-to-end

iUSD Pay ships fully localized for **19 languages** out of the box, covering
the top consumer-finance markets across the Americas, Europe, Middle East,
and Asia-Pacific. This is not a "we translated the home page" gesture —
every page, modal, toast, gift box name/description, error, and
server-returned message is translated, and drift is prevented in CI.

| Area | Coverage |
|---|---|
| Locales shipped | `en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `th`, `es`, `it`, `fr`, `de`, `pt`, `hi`, `ar`, `tr`, `el`, `ru`, `ms`, `id`, `fil` (19 total) |
| Translation keys | **~976 per locale**, fully parallel across all 19 files |
| Detection | `i18next-browser-languagedetector` auto-detects browser language, falls back to `en`, persisted in `localStorage` |
| Manual switch | **LangSwitcher** in Settings — live switch without reload |
| RTL | First-class right-to-left layout for Arabic (`dir="rtl"`) — not just mirrored CSS, also re-ordered icons and form affordances |
| Server errors | Fastify `preSerialization` hook reads `Accept-Language` and returns **translated error bodies** — the 22 error codes are localized on the API side, not just the client |
| Rich content | All **24 on-chain gift-box names + museum-grade descriptions** translated across 19 locales (not machine-output — hand-authored per locale) |
| CI guard | [`packages/app/scripts/check-i18n.mjs`](packages/app/scripts/check-i18n.mjs) runs in CI and fails the build on any missing or orphaned key across locales |
| Preview | Staging build with language switcher front-and-center at <https://i18n.iusd-pay.xyz> |

Implementation lives in
[`packages/app/src/i18n/`](packages/app/src/i18n/) (React side, `i18next` +
`react-i18next`) and [`packages/api/src/lib/i18n.ts`](packages/api/src/lib/i18n.ts)
(API side).

### 2.6 Backend, infra, and CI/CD

- **Fastify API** with ECIES viewing-key custody, OFAC screening, OG meta
  endpoints, SSE streams, and 40+ PostgreSQL tables
- **Background worker** that drains gift/payment claim queues and submits
  on-chain TXs through a relayer pool (9 workers — pay / gift / sweep)
- **PostgreSQL** schema covering accounts, contacts, payments, gifts,
  invoices, comments, reactions, notifications
- **Cloudflare Worker** that rewrites OG meta so gift links preview correctly
  in Telegram / Twitter / WhatsApp / Slack bot UAs
- **Five independent GitHub Actions deploy workflows** — one per tier
  (db / api / relayer / frontend / admin) with `paths:` filters so each
  service is only re-shipped when its own code changes

---


## 3. Product Value & UX

### Core user journeys (all one signature)

| Flow | What the user does | On BNB Chain |
|---|---|---|
| **Send**    | Pick contact → amount → confirm | On-chain privacy, one wallet signature |
| **Request** | Enter amount → share QR / short link | Real-time chain status + optional invoice |
| **Gift**    | Pick box → memo → recipient / Anyone → confirm | On-chain gift packet, equal / random split, viral share link |
| **Claim**   | Open link → sign | Viewing-key session, instant unwrap animation |
| **Invoice refund** | Any paid invoice → "↩ Refund Payer" | Direct `IPayPool.refund` TX, no backend round-trip |
| **Top up** | Get USDT / BNB on BSC | Any exchange or bridge; testnet faucet on BSC testnet |

### Home screen at a glance

- DNA-colored identity card (avatar + short-id) generated
  from the user's address
- Live USDT balance with an inline top-up link
- **Inbox** — incoming payments with auto-claim (on by default for new
  accounts) or manual claim
- **History** — date-grouped, searchable, with per-row revoke / refund /
  receipt / invoice PDF
- **Gifts** — gallery of 24 on-chain boxes plus Sent / Received / Reactions
  tabs
- **Contacts** — auto-seeded from activity, search-to-send
- **PWA-installable** on iOS Safari and Android Chrome

### Gifts — a brand-new social channel on top of stablecoin payments

This is the piece we're most excited about. Every other on-chain payment
product in the market today stops at "transfer + optional memo". iUSD Pay
turns the payment object itself into a **social surface** — a shareable,
programmable artifact that both sides of the transaction can talk around,
react to, and build relationships through.

Gift packets are not a virality hack layered on top of payments. They are
**a new category of social interaction that only becomes possible once
you have privacy-preserving stablecoin rails underneath**:

- **The gift is a first-class on-chain object**, not a transaction meta
  field. It has its own ID, its own box art, its own memo, its own
  equal / random split mode, its own share URL, its own state machine
  (wrapped → shared → claimed → thanked → revoked).
- **A gift is a conversation starter, not a transfer receipt.** Sender
  picks a museum-grade box (`Watch`, `Music Box`, `Dragonfly Brooch`,
  `Crown of the Andes` …), writes a handwritten memo in a chosen font,
  picks equal or random for group mode, and ships it. Recipient gets a
  shareable link before even opening it.
- **Social primitives that rails don't have:**
    - **Mystery-box OG previews** — the share link renders as a sealed
      present across Telegram / Twitter / WhatsApp / Slack (a CF Worker
      rewrites OG meta; contents are never leaked before claim).
    - **Wrap / unwrap animations** — the claim flow is a multi-stage
      montage (ribbon untie → lid lift → memo reveal → amount counter)
      that makes opening a gift feel like opening a gift, not signing a
      TX.
    - **Thank-you replies + reactions** — claimer can emoji-react and
      send a letter back. Third parties who see the share link can
      react too, so the surface is feed-like, not 1-to-1.
    - **Encrypted private chat between sponsor and claimer** — layered
      on the exact same viewing-key infrastructure used by the payment
      envelopes. The sender can DM the recipient privately, post-claim,
      without leaking anything on chain.
    - **Group red envelopes with equal / random modes** — 1 gift can be
      claimed by N people, either evenly or with a programmable random
      split. Chinese New Year 红包 culture as a first-class on-chain
      object.
- **Viral by construction.** A gift link is also an invite link. The
  first gift a user receives is the same click that signs them up.
  Zero-CAC acquisition — the network grows by how much value circulates
  through it, not by how much is spent on ads.
- **Gift + brand = a new commerce category.** A brand gift card (e.g.
  **Fly Coffee**) is both a payment **and** a loyalty voucher — the
  holder gets in-store discounts on top of the wrap value. This is
  only possible because the gift object persists on-chain and can be
  queried by any redemption partner.

**In one line:** iUSD Pay isn't using gifts to grow payments. iUSD Pay
is turning on-chain stablecoin payments into the backbone of a social
network that didn't exist before.

---


## 5. Market Understanding

### Target user

- **Primary** — stablecoin-holding crypto natives (tens of millions globally)
  who currently use Venmo / PayPal / Revolut for fiat P2P and are frustrated
  that their on-chain USD has no equivalent UX.
- **Secondary** — small merchants and freelancers who want to invoice in
  USDT (business invoice mode ships in v1 with invoice number, due date,
  PDF export, and merchant profile).
- **Tertiary** — gift-native cultures. Chinese New Year and birthday red
  envelopes, wedding cash, Mother's Day — where "send a gift" matches
  existing behaviour better than "send a payment".

### Go-to-market

- **Viral by design.** Every gift is a share link, so iUSD Pay spreads by
  recipients, not marketing. The first gift a user receives is also their
  sign-up path, with no app-store friction.
- **Mobile-first PWA.** Install to home screen in two taps. No TestFlight,
  no Google Play review, no platform tax.
- **BNB Chain reach.** Low fees and the largest retail wallet footprint
  (Trust Wallet, Binance Web3 Wallet, MetaMask) make BNB Chain a natural home
  for consumer stablecoin payments.

### Revenue model — not just a payment rail

iUSD Pay is designed to make money on two axes, *not* on transaction gas:

1. **Tiered gift-box fees.** We shipped 24 museum-grade collectible gift
   boxes (watches, paintings, instruments, jewelry) — each one is a
   first-class on-chain object with its own configurable `fee_bps`. A
   "Standard" wrap is 0.5%, a "Crown of the Andes" premium wrap can be
   higher. The gift itself becomes the unit economy — users pay for
   delight, not for moving bytes.
2. **Brand partnerships on top of gift cards.** Scene 6 of the demo shows
   the play: a real merchant (**Fly Coffee**) lists a branded gift box. Any
   user who holds that box can redeem a 50% discount in store. The merchant
   subsidizes the discount to acquire crypto-native customers; iUSD Pay
   takes a cut of each wrap. This is Groupon × Venmo × stablecoin payments
   — a category no one else has shipped on BNB Chain.

Both axes exist today in the live app. The box catalog is hot-editable by
admin without code changes, so onboarding a new brand partner is a
copy-paste job.

### Competitive landscape

| Category | Example | Why iUSD Pay is distinct |
|---|---|---|
| Fiat P2P | Venmo, PayPal, Revolut | Custodial, US-/EU-only, no programmable on-chain primitives |
| On-chain USDC wallets | Circle Pay, Phantom Pay | On-chain but **no privacy**, no gift primitive, wallet-first UX |
| Privacy coins | Zcash, Monero wallets | Privacy but **no stablecoin**, no request / invoice / gift object |
| Mixers | Tornado-style | Opaque but **not compliant** — no admin audit envelope |
| Consumer crypto pay apps on BNB Chain | — | Private payments + gift objects + compliance audit in one consumer app |

### Why it's defensible

- **Privacy + compliance** is a rare combination — most privacy apps pick
  one. Dual-recipient ECIES gives you both without a trust tradeoff.
- **Gift virality** creates a zero-CAC acquisition channel that wallet-first
  competitors can't match without adding a social layer.
- **PWA-first** sidesteps every app-store gatekeeper simultaneously.
- **BNB Chain-native** puts the app one tap away from the largest retail
  stablecoin user base on any EVM chain.

---

---

## Repository guide

| Path | Contents |
|---|---|
| `packages/contracts/foundry/` | `IPayPool.sol`, `IPayGiftPool.sol`, `MockERC20.sol`, tests, deploy script |
| `packages/contracts/legacy/move/` | Original Initia Move modules (reference only) |
| `packages/api/` | Fastify API + background relayer worker + ECIES services; BSC adapter in `src/lib/bnb/` |
| `packages/app/` | React 19 + Vite frontend; BNB wallet + contract adapter in `src/lib/bnb/` |
| `packages/admin/` | Internal compliance / merchant console |
| `cf-worker/` | Cloudflare Worker for OG meta rewriting |
| `scripts/deploy/` | `bsc-deploy.sh`, `bsc-register-gift-boxes.sh`, build/deploy scripts (`legacy-initia/` = old Move flow) |
| `.github/workflows/` | Deploy pipelines |
