# Equinox Agent

> **Self-repaying loans on BNB Chain. The spread does the work.**

Equinox Agent adalah aplikasi DeFi consumer di BNB Chain. User deposit collateral BNB, agent otomatis pinjam USDT dengan rate terbaik, sebagian cair ke user, sebagian di-lend ke vault yield tertinggi. Selisih bunga (spread) dipakai buat lunasin utang user otomatis. User gak perlu manage apa-apa.

---

## Problem yang Dipecahkan

DeFi lending biasa minta user:
- Mantau Health Factor 24/7
- Bayar bunga sendiri tiap bulan
- Pantau likuidasi pas market crash
- Cari vault terbaik manual

Equinox Agent ngilangin semua itu. **User cuma deposit sekali dan pilih risk profile. Sisanya agent.**

---

## Konsep Utama

Tiga konsep yang user harus paham:

**1. Collateral** — Aset user (BNB) yang dijaminkan. Tetap utuh selama position aktif.

**2. Active Debt** — Pinjaman USDT user dari Venus. Agent yang bayar utang ini via spread capture.

**3. Shadow Wallet** — Saldo USDT user yang bisa di-withdraw kapan aja. Diisi otomatis saat collateral apresiasi dan saat spread melimpah.

---

## User Flow End-to-End

### 1. Landing Page

**Tujuan**: Convert visitor jadi user.

**Komponen**:
- Hero: tagline + tombol "Get Started"
- Section explainer: "How it works" (3-step illustrated)
- Section "Why Equinox": comparison vs Aave/Venus
- Section trust signals: audit status, sponsor logo, total positions, total spread captured (dummy data dulu)
- Footer

**Action**: Tombol "Get Started" → buka modal login.

---

### 2. Login (Wallet / Social login)

**Tujuan**: User auth tanpa harus install wallet.

**Flow**:
1. User klik "Get Started" → modal muncul
2. Modal kasih opsi: "Continue with Google" / "Continue with Apple" / "Continue with Email"
3. User pilih provider → redirect ke OAuth flow
4. Setelah callback, user dapat embedded wallet address di BNB Chain
5. Frontend check ke backend: user existing atau baru?
6. Kalau baru: redirect ke onboarding wizard
7. Kalau existing: redirect ke dashboard

**Catatan UX**: jangan tampilkan address wallet sebagai "wallet address" — user awam gak peduli. Tampilkan email/nama dari provider.

---

### 3. Onboarding Wizard (5 step)

**Tujuan**: User pertama buka position dengan 0 friction.

#### Step 1: Pilih Collateral Asset
- Tampilan: card asset dengan logo + nama + saldo user
- MVP: cuma BNB yang aktif. Asset lain (slisBNB, ETH, BTC) di-disable dengan label "Coming soon"
- User klik BNB → next

#### Step 2: Input Amount
- Input field: amount BNB
- Slider dari 0 sampai max balance
- Show USD equivalent real-time (Chainlink price)
- Tombol "Max" untuk pakai semua saldo
- Validation: min deposit (misal 0.05 BNB), gak boleh exceed balance
- Next button

#### Step 3: Pilih Mode
- MVP cuma 1 mode aktif: **Loan + Auto-Repay**
- Tampilkan 3 card mode, dua lainnya disabled dengan label "Coming Soon":
  - 💰 Forever Income (disabled)
  - 🎯 **Loan + Auto-Repay** (selected default)
  - 🚀 Yield Maximizer (disabled)
- Setiap card kasih 1-2 kalimat explainer
- Next button

#### Step 4: Input Target Payoff Date
- Date picker atau preset: 3 / 6 / 12 / 24 bulan
- Default: 6 bulan
- Show "Target date: [tanggal X]"
- Next button

#### Step 5: Pilih Risk Profile
- 3 card vertical:
  - 🛡 **Conservative** — LTV 40%. Aman dari likuidasi. Yield kecil.
  - ⚖️ **Balanced** — LTV 55%. Seimbang. (recommended)
  - 🔥 **Aggressive** — LTV 70%. Yield maksimal. Risk likuidasi lebih tinggi.
- Setiap card show:
  - LTV ratio
  - Estimated APY range
  - Alokasi default: Lista vs PancakeSwap split
  - Liquidation price (berdasarkan amount + price now)
- Next button

#### Confirmation Screen
Sebelum execute, tampilkan summary:
```
You're about to:
  • Deposit:           5 BNB ($3,500)
  • Borrow:            $1,925 USDT (Venus, 55% LTV)
  • You receive:       $1,155 USDT to your wallet (60%)
  • Agent will manage: $770 USDT in yield vaults (40%)
       └─ $462 in Lista USDT (60% of recycle)
       └─ $308 in PancakeSwap USDT/USDC LP (40% of recycle)
  • Estimated payoff:  ~6 months (based on current spread)
  • Liquidation price: $490 (BNB now $700)

[Cancel]  [Confirm & Activate]
```

User klik "Confirm & Activate" → wallet sign TX → submit ke BNB Chain.

Loading state: "Activating your agent..." dengan progress indicator. Polling status sampai event `PositionOpened` muncul.

---

### 4. Dashboard

**Tujuan**: User lihat status position-nya dengan jelas dan cepat.

**Top section: Position Summary (3 balance cards)**

```
┌─ Collateral ────────┐  ┌─ Active Debt ───────┐  ┌─ Shadow Wallet ─────┐
│ 5 BNB               │  │ $1,925 USDT         │  │ $42.50 USDT         │
│ $3,500              │  │ Agent managing      │  │ [Withdraw]          │
│ "Stays whole"       │  │ Payoff: 5mo 12d     │  │ Spendable anytime   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**Middle section: Health Factor Gauge**

Visual gauge (semi-circle atau linear bar) dengan color coding:
- HF > 1.5: green ("Safe")
- HF 1.3-1.5: yellow ("Caution")
- HF < 1.3: red ("Defense active")

Show current liquidation price + current BNB price.

**Mode B specific: Progress section**

```
Debt Repayment Progress
[████████░░░░░░░░░░░░] 38% repaid
Original debt: $1,925 USDT
Current debt: $1,193 USDT
Projected payoff: Aug 12, 2026 (on track)
```

Kalau ahead schedule: badge hijau "Ahead of schedule"
Kalau behind schedule: badge kuning "Agent adjusting allocation"

**Bottom section: Activity Feed**

Real-time list event (SSE), scroll-able:
```
🟢 2 min ago — Spread captured: +$0.42 (debt repaid)
🔄 4 hours ago — Rebalanced: shifted $50 from Lista to PancakeSwap
🟢 8 hours ago — Spread captured: +$0.38 (debt repaid)
⚡ 1 day ago — BNB price up 2.1%, $5.20 added to Shadow
🛡 2 days ago — Defense triggered: HF restored from 1.28 to 1.55
```

Tiap entry punya icon, timestamp, deskripsi singkat. Click → detail modal.

**Action buttons (sidebar atau top-right)**:
- "Close Position" — masuk close flow
- "View Manifesto" — buka modal trust verification
- "Settings" — sub-page settings

---

### 5. Withdraw Shadow Wallet

**Tujuan**: User ambil USDT dari Shadow ke wallet eksternal.

**Flow**:
1. User klik tombol "Withdraw" di Shadow card
2. Modal muncul:
   - Available: $42.50 USDT
   - Input amount (with Max button)
   - Show: destination wallet address (user's BNB Chain wallet address)
   - Button "Confirm Withdraw"
3. User confirm → wallet sign → submit
4. Loading state → success state
5. Shadow balance update real-time

**Catatan**: gak ada fee dari Equinox untuk withdraw. Cuma gas BNB (beberapa sen).

---

### 6. Close Position

**Tujuan**: User keluar dari position, dapat collateral utuh balik.

**Step 1: Klik "Close Position"**

Modal muncul dengan preview:

**Happy path (allocation cukup untuk repay debt)**:
```
Closing Summary
  Current debt:           $1,193 USDT
  Available from agent:   $1,250 USDT
    └─ Lista:           $720 USDT
    └─ PancakeSwap LP:          $530 USDT

  After close:
    • Debt fully repaid via agent allocations
    • Surplus $57 USDT returned to you
    • Collateral 5 BNB returned to your wallet ✓

[Cancel]  [Confirm Close]
```

**Edge case (allocation kurang dari debt)**:
```
Closing Summary
  Current debt:           $1,193 USDT
  Available from agent:   $980 USDT
  Gap:                    $213 USDT

To close, you need to cover the gap. Choose:

  ○ Use my Shadow Wallet ($42 available)
    Remaining gap: $171

  ○ Add USDT from my wallet
    [input amount]

  ○ Auto-sell 0.33 BNB from collateral (~$228)
    You'll get back 4.67 BNB

[Cancel]  [Continue]
```

User pilih opsi → konfirmasi → submit TX.

**Step 2: Loading**

Tampilkan progres:
- Unwinding Lista position...
- Unwinding PancakeSwap LP...
- Repaying Venus debt...
- Returning collateral...

**Step 3: Success Screen**

```
Position closed ✓

Summary:
  • Deposited:            5 BNB
  • Received back:        5 BNB
  • Cash earned:          $42 (Shadow)
  • Total time:           4 months 12 days

[Open New Position]  [Back to Home]
```

---

### 7. Manifesto Trust View

**Tujuan**: User verify behavior agent transparan dan immutable.

**Trigger**: Klik "View Manifesto" di dashboard.

**Modal/page show**:

```
Your Agent's Behavior Rules

Risk Profile: Balanced
Mode: Loan + Auto-Repay
Manifesto Version: 1.0.0
BNB Greenfield Storage: [View raw file ↗]
Hash: 0xabc123...

Parameters:
  LTV Target:              55%
  LTV Maximum:              65%
  Defense Threshold (HF):  1.3
  Warning Threshold (HF):  1.5
  Recycle Ratio:           30-50% (dynamic)
  Buffer Minimum:          10% of debt

Routing Policy:
  Borrow source:           Venus
  Lend destinations:
    • Lista USDT pool    (max 60% of recycle)
    • PancakeSwap USDT/USDC LP   (max 40% of recycle)
  Rebalance threshold:     0.5% APR difference

This manifesto is immutable. Agent cannot deviate from these rules.
```

**Action**: tombol "View raw file" → buka link BNB Greenfield object (JSON file).

**Trust badge**: kalau manifesto belum di-update dari saat user open position, tampilkan "✓ Verified — unchanged since activation".

---

### 8. Defense Event Detail

**Tujuan**: User paham apa yang terjadi saat HF turun dan defense trigger.

**Trigger**: User klik defense event di Activity Feed.

**Modal show**:

```
🛡 Defense Triggered

Time: 2 days ago (Mar 15, 2026, 14:22)

Trigger:
  BNB price dropped: $700 → $560 (-20%)
  HF dropped to: 1.28 (below 1.3 threshold)

Actions taken:
  1. Withdrew $462 from Lista
  2. Unwound $96 from PancakeSwap LP
  3. Repaid $558 to Venus
  4. HF restored to: 1.55 ✓

Result:
  • Your collateral: SAFE (5 BNB unchanged)
  • New debt: $1,365 (from $1,923)
  • Allocations reduced (will be rebuilt from spread)

Defense reward: $2.79 USDT paid to caller (anyone can trigger defense)
```

---

### 9. Settings Page

**Tujuan**: User adjust preferensi.

**Sections**:

**Account**
- Email (dari login provider, read-only)
- BNB Chain address (collapsed, copy button)
- Logout

**Notifications**
- Toggle: Defense alerts (default ON)
- Toggle: Spread capture milestones (default OFF)
- Toggle: Mode adjustments (default ON)

**Display**
- Currency preference: USD / IDR / EUR
- Language: English / Indonesian (kalau ready)
- Theme: Light / Dark (default Dark)

**Advanced** (defer post-MVP, prep UI placeholder)
- Pro Mode toggle (disabled, "Coming soon")

**Danger Zone**
- Close all positions
- Delete account

---

### 10. Empty States

**Setelah login pertama (belum punya position)**:
```
Welcome to Equinox Agent

You don't have any active positions yet.
Open your first position to let the agent work for you.

[Open Position]

Or, learn more:
  • How it works
  • FAQ
  • Risk disclosure
```

**Saat dashboard loading**:
- Skeleton screens, jangan spinner kosong.

**Saat connection error**:
```
Connection lost
Reconnecting...
[Retry]
```

---

### 11. In-app Notifications (Toast/Banner)

Kalau ada event penting, tampilkan toast/banner di top dashboard:

- ✓ Position activated successfully
- 🛡 Defense triggered — collateral safe
- ⚡ Big spread captured — debt reduced 5%
- ⚠️ Behind schedule — agent adjusted allocation

Auto-dismiss setelah 8 detik. Click → buka detail di Activity Feed.

---

## Design Guidelines

**Aesthetic**: Black-and-white palette dengan satu accent color. Glowing highlights di active states. Clean, minimal, "elegant clean expensive."

**Jangan**: gradient, neon, terlalu banyak emoji, ilustrasi cartoonish.

**Boleh**: subtle animation, hover states, glow effect di tombol primer, monospace font untuk angka/address.

**Typography**: gunakan font professional (Inter, Geist, atau SF Pro). Angka pakai tabular-nums.

**Mobile-first**: semua flow harus jalan di mobile. Dashboard responsive, onboarding tetap 5 step di mobile.

---

## Halaman yang Dibutuhkan

Frontend team perlu build:

1. Landing page
2. Login modal
3. Onboarding wizard (5 step + confirmation)
4. Dashboard
5. Withdraw modal
6. Close position flow (multi-state)
7. Manifesto view modal
8. Defense event detail modal
9. Activity feed (component, reused di dashboard)
10. Settings page

---

## Data yang Dibutuhkan dari Backend

Backend akan expose REST API + SSE stream. Spec detail nyusul. Frontend bisa start dengan mock data untuk:

- User profile
- Position state (collateral, debt, shadow balance, HF)
- Market rates (Venus borrow APR, Lista lend APR, PancakeSwap LP APR)
- BNB price (real-time via Chainlink, eventually)
- Activity events
- Manifesto content (JSON dari BNB Greenfield)

---

## Catatan untuk Frontend Team

- **Tech stack: bebas pilih** sesuai kenyamanan team. Next.js + Tailwind + shadcn/ui adalah default sugestion, tapi gak strict.
- **Wallet handling**: pakai wagmi + viem (chain `bsc` / `bscTestnet`) dengan injected wallet (MetaMask, Trust Wallet, Binance Wallet) atau social login / embedded wallet. Backend gak pegang private key user — semua TX di-sign di client.
- **State management**: bebas (Zustand, Jotai, Redux). Yang penting konsisten.
- **API integration**: bisa pakai react-query, SWR, atau fetch native.
- **Real-time**: SSE pakai native EventSource API, atau library kayak `@microsoft/fetch-event-source`.
- **Testing**: cypress/playwright untuk E2E happy path minimum.

---

## Smart contracts (BNB Chain)

- Solidity contracts (Foundry): `contracts/`. Target: BSC Testnet (chain 97), with mainnet (56) as a config switch. See `contracts/README.md`.
- Migration notes (Sui to BNB Chain) and TODOs: `MIGRATION-BNB.md`.
- The original Sui Move package is kept for reference: `legacy/sui-move/`.

## Deployments

### BSC Testnet (chain 97), 2026-09-25

| Contract | Address |
|---|---|
| EquinoxRegistry | [0x3295b8931F72D98D426334f8266aDC0a7c661537](https://testnet.bscscan.com/address/0x3295b8931F72D98D426334f8266aDC0a7c661537) |
| PriceOracle | [0xcC4041A339686d812aFB0d8697ce2EBeEaC5e95d](https://testnet.bscscan.com/address/0xcC4041A339686d812aFB0d8697ce2EBeEaC5e95d) |
| EquinoxVaults | [0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32](https://testnet.bscscan.com/address/0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32) |
| NativePool (debt lender, tUSDT) | [0xEbC610e820f6997bF8BC53C596B6fB00799E2d49](https://testnet.bscscan.com/address/0xEbC610e820f6997bF8BC53C596B6fB00799E2d49) |
| NativePool (collateral venue, tWBNB) | [0x647A40014401B65c23518D9d11772a0530d49549](https://testnet.bscscan.com/address/0x647A40014401B65c23518D9d11772a0530d49549) |
| ShadowPool | [0x3D8bC76c19257E5f56b21Bfcc08f01845c193C89](https://testnet.bscscan.com/address/0x3D8bC76c19257E5f56b21Bfcc08f01845c193C89) |
| tWBNB (mock) | [0xe3768ca9E91B43F9f96f1A5d37848e2568023923](https://testnet.bscscan.com/address/0xe3768ca9E91B43F9f96f1A5d37848e2568023923) |
| tUSDT (mock) | [0x3Ba7BFdFe0D3a5435665839e4F8F57Fd874Cb6d4](https://testnet.bscscan.com/address/0x3Ba7BFdFe0D3a5435665839e4F8F57Fd874Cb6d4) |

Machine-readable: `contracts/deployments/bsc-testnet.json`. Not verified on BscScan (no API key). Smoke-flow tx hashes are in `VERIFY-BNB.md`.

---

**Equinox Agent** © 2026
