# 05 — Ecosystem Fit: the "Mezo question"

## The concern

Cermin v1 won partly because Mezo's ecosystem was a perfect fit: BTC collateral DeFi and stablecoin lending already existed, so Cermin plugged into live rails. Does Canton give Cermin-RWA the same fit?

## Honest answer: the fit is different, and arguably better — but not identical

### What Canton HAS (stronger than Mezo)
- **The collateral side is enormous and real.** ~$335B represented US Treasuries (Broadridge DLR), $8T+/month repo flow, DTCC tokenized Treasuries rolling out 2026, tokenized gold pilots (Euroclear + World Gold Council), Ctrl Alt $1.4B+ across real estate/private credit/commodities. Mezo had BTC; Canton has the entire institutional collateral universe.
- **The cash leg is arriving.** Native stablecoins, institutional MMFs, JPM Coin phased rollout 2026.
- **Lending venues exist.** ACME (overcollateralized lending), Alpend (money market — explicitly markets "borrow without publicly exposing positions"), LendOS (commercial lending).
- **A standard integration surface exists.** CIP-56 means one token interface covers every compliant asset — Mezo never offered that.

### What Canton LACKS (the honest gap)
- ACME/Alpend do not expose public devnet APIs or open-source contracts we can compose with during the hackathon. Institutional apps on Canton are permissioned; you integrate via partnership, not permissionless composability.
- So unlike Mezo, we cannot literally sit on a live third-party lending pool during the hackathon.

## Strategy that resolves the gap

1. **Build a thin reference lending pool ourselves** (1 Daml template set, small effort) purely so the agent has something to protect in the demo. It is a stand-in, not the product.
2. **Architect the agent against CIP-56 interfaces, not against our pool.** The submission states: "Cermin-RWA attaches to any CIP-56 collateral and any Daml lending venue; the reference pool exists because production venues are permissioned."
3. **Turn the gap into the roadmap slide:** post-hackathon path = partner integration with Alpend/ACME (their privacy-first positioning is *identical* to ours — Alpend already sells "borrow without exposing positions"; a protection agent is a natural add-on they don't have).

## Why judges will accept this

- The Canton Foundation supports this track precisely to seed apps like these; a protection layer that makes their flagship RWA-lending narrative safer is on-thesis.
- "Permissioned ecosystem, so we built a reference venue + standard interfaces" is exactly how real Canton apps are developed (CN Quickstart itself teaches this pattern).
- The moat claim survives: on EVM the agent's strategy would be public and exploitable; on Canton it is invisible. The ecosystem doesn't just fit — it is the only place this product can exist.

## One-sentence answer to the concern

Mezo gave Cermin live rails to plug into; Canton gives Cermin-RWA something rarer — a $300B+ collateral base, a token standard to attach to, and a privacy model that makes the product possible at all — at the cost of building one thin reference pool for the demo.
