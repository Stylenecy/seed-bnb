# demo-bajigur: BNB Chain migration

**Nothing needed changing.**

demo-bajigur is a static React + Vite landing-page demo ("NOVA_AI" scroll-video hero). I audited
`src/App.tsx`, `src/ScrollVideo.tsx`, `src/main.tsx`, `index.html`, `README.md` and `package.json`.
There are no chain references: no wallet library, no RPC, no chain id, no explorer links, no token
symbols, and no mention of any blockchain in the copy. There is nothing to rebrand to BNB Chain.

## If BNB Chain branding or a wallet is wanted later

- Copy: add "Built on BNB Chain" wherever the product story lives (`src/App.tsx`, `SectionOne` and
  `SectionTwo`).
- Wallet: add `wagmi` + `viem` and use `bsc` / `bscTestnet` from `viem/chains`. BSC testnet is
  chainId 97, RPC https://data-seed-prebsc-1-s1.bnbchain.org:8545, explorer
  https://testnet.bscscan.com.

## Verification

Nothing to check, since no files changed.
