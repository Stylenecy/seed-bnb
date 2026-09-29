# VERIFY-BNB: demo-bajigur

Verified 2026-09-25. **Verdict: WORKS.** This is a static landing page with no chain code, so there is nothing BNB-specific to run.

| Check | Result | Notes |
|---|---|---|
| `npm ci` | PASS | 105 packages |
| `npm run build` (`tsc -b && vite build`) | PASS | 232 kB JS / 10.5 kB CSS |
| `oxlint` | PASS | 0 issues |
| `vite preview` on :3173 | PASS | HTTP 200, title "NOVA_AI — Today AI Aligns With Bold Dreams" |
| External asset (hero MP4 on CloudFront) | PASS | HTTP 200 |
| Contracts / backend / fork deploy | N/A | None exist |
| BSC address checks | N/A | No addresses, RPCs or chain ids in the code |

Bugs fixed: none.

Steps remaining for BSC testnet: none. If a wallet or BNB branding is wanted later, see MIGRATION-BNB.md (wagmi/viem `bscTestnet`, chain 97).
