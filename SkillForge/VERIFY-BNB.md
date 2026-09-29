# VERIFY-BNB: SkillForge

Docs only. **PARTIAL:** the README is correct for BNB Chain, but the wireframe and the empty code folders did not match it.

| Check | Result | Notes |
|---|---|---|
| README chain facts | PASS | Chain ids 97/56 match the listed RPCs. USDT `0x55d3…7955` is "USDT" with 18 decimals on BSC mainnet. No leftover Celo, MiniPay, cUSD, Monad or Mantle text. |
| README vs repo contents | FIXED | Section 6 says `yarn install` / `cp .env.example`, but there is no `package.json` or `.env.example`, and `contracts/` and `frontend/` are empty. I added a status note saying these are planned steps. |
| `SkillForge-wireframe.png` | FAIL (not editable here) | The image still shows "Built on celo / Powered by MiniPay", cUSD amounts, "Celo Citizenship", and "on Celo blockchain". Needs a redesign. The README note tells readers to treat it as BNB/USDT. |
| Contracts / frontend build / fork | N/A | No code |

Useful for when code is written: the canonical ERC-8004 registries are live on BSC.
- Mainnet: IdentityRegistry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, ReputationRegistry `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`.
- Testnet: `0x8004A818BFB912233c491871b3d84c89A494BD9e` and `0x8004B663056A597Dffe9eCcC1965A193B7388713`.
- All four have code (checked with `cast code`).

Remaining steps: write the code; on testnet, deploy a MockERC20 (18 dec) as USDT. That needs about 0.01 tBNB. Also confirm that Virtuals ACP and the x402 facilitator support BSC.
