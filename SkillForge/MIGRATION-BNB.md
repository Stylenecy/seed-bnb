# Migration: Celo (MiniPay) -> BNB Chain

This project is concept-only (README + wireframe image); there is no code to port.

## What changed
- README rewritten for BNB Smart Chain: Celo/MiniPay -> BSC with wagmi/viem + RainbowKit; cUSD -> USDT (BEP-20, 18 decimals); Celo Composer/`@celo/minipay-react` -> Next.js + wagmi; "Celo Citizenship" -> "BNB Citizenship"; Celo Proof of Ship -> BNB Chain hackathon alignment.
- Added BSC testnet/mainnet chain IDs, RPCs, explorers, faucet, and BSC env vars to the setup section.
- Restored Markdown formatting (the original README was collapsed into one line).

## TODO
- `SkillForge-wireframe.png` may still show Celo/MiniPay branding; it's an image and was not edited.
- When code is written: use `bsc` / `bscTestnet` from `viem/chains`, deploy a MockERC20 (18 dec) as USDT on testnet, and deploy/choose an ERC-8004 Identity Registry on BSC.
- Check that Virtuals ACP and the chosen x402 facilitator support BSC before relying on them.
