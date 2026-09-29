# Deployments

## Sui testnet (current, finalized: reserve-fund, templates, venue selection)

Fresh publish of the finalized package (reserve-fund model, strategy templates,
borrow/lend venue selection). **Use these ids.**

| Object | ID |
|--------|----|
| **Package** | `0xd0718e89f68369c41623636598da1b4b27c826960afcbb9551d89d6f6e669348` |
| Registry (shared) | `0x3c6041d5ab6cab80dbf5dddb58379d50e10d1f93eea4d00461664ec003ddc31c` |
| PriceCache (shared) | `0x03fe5d47f4b65b6da24dbc29d34d0e54cd117e6f2631a9ee04d3cdd07425726d` |
| AdminCap (deployer) | `0x63f342f8d5f2944b4a384d2d5f4419c8cd36d7e21c800a152f1230ca1b60edea` |
| UpgradeCap (deployer) | `0x5d78b38314c979bad187ce2307a2801f8ed7d75b8327eac60eb0d6367cdb1cf9` |
| Deployer address | `0xa72ee888a2c309cd887d70aa472c71f65101a41345c0497c8e4b540ecab0b9a1` |

> Needs bootstrap (admin): create pools, register venues + assets, issue caps,
> refresh prices, see the README "Deploy runbook" §4 and the demo below.

---

## Earlier demo (superseded), pre-reserve-model, with full skim/defend walkthrough

Kept for the worked end-to-end example (object ids/txs below belong to THIS older
package; the function names there were `skim_to_shadow` etc.).

| Object | ID |
|--------|----|
| Package (original / type identity) | `0xa2071656fec7ac3370cab29634c8ab3b3a9655a202bcdd632db6ebab0a1ec599` |
| Package (latest version) | `0x3868c7de39e6a886fa510144755079ef7d7d21d1c82cfc10d78b7779f2297ab6` |
| Registry (shared) | `0x27f07900fe34358ea56d1f2c12a71370133750e42722368125662fe74ba1c90e` |
| PriceCache (shared) | `0x96644b0bb473b838a4b67cbf8e887e72cd32e386e05190e120229140783592db` |
| AdminCap (deployer) | `0x0afac970d6342c6bd4678119dbf96e6dfdf443e42ef0aeef550cbe3180257a88` |
| UpgradeCap (deployer) | `0x774557f1185d80c687a003cdf9888a8e1f9361bf4d1daf16334f8e8a8198c286` |

Published with `--skip-dependency-verification` (the vendored Pyth/Wormhole
interface stubs don't byte-match the on-chain packages; linkage is by id).
Later **upgraded** via the UpgradeCap (compatible policy; added the
pause-guard on `skim`), full deploy→upgrade lifecycle proven on testnet. Shared
object ids (Registry/PriceCache/etc.) are unchanged across the upgrade.

### Pyth (testnet) coordinates used

| | ID |
|--|----|
| Pyth package (defining id) | `0xabf837e98c26087cba0883c0a7a28326b1fa3c5e1e2c5abdb486f9e8f594c837` |
| Wormhole package (linkage) | `0xf47329f4344f3bf0f8e436e2f7b485466cff300f12a166563995d3888c296a94` |
| Pyth state | `0x243759059f4c3111179da5878c12f68d612c21a8d54d85edc86164bb18be1c7c` |
| Hermes (testnet) | `https://hermes-beta.pyth.network` |

### Feed id → testnet PriceInfoObject

| Pair | Feed id | PriceInfoObject |
|------|---------|-----------------|
| SUI/USD | `0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266` | `0x1ebb295c789cc42b3b2a1606482cd1c7124076a0f5676718501fda8c7fd075a0` |
| BTC/USD | `0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b` | `0x72431a238277695d3f31e4425225a4462674ee6cceeea9d66447b210755fffba` |
| ETH/USD | `0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6` | `0x4fde30cb8a5dc3cfee1c1c358fc66dc308408827efb217247c7ba54d76ccbee9` |

USDC/USD has no PriceInfoObject on testnet (debt asset is treated separately).

### Validation transactions

- `register_asset<0x2::sui::SUI>` → `GJUSxJpqeTUEvMqx8rhJrc7ZCLM7cV9PwKyQkbW2iEeb`
- `oracle::refresh_from_pyth<0x2::sui::SUI>` → `2ijcCHvu5HPMSokbSsEMHnvHYmDGBZJxMREiYue7GyB3`
- Result in PriceCache: `0x2::sui::SUI → price_8dp = 76_712_844` (SUI/USD ≈ $0.767).

### Reproduce the trustless read

```bash
# (object ids above)
sui client ptb \
  --move-call <PKG>::oracle::refresh_from_pyth '<0x2::sui::SUI>' \
  @<CACHE> @<REGISTRY> @<SUI_PRICE_INFO_OBJECT> 60 @0x6
```

For production freshness, the PTB should first call `pythClient.updatePriceFeeds`
(SuiPythClient, Hermes-beta) so the PriceInfoObject is fresh, then use a tight
`max_age_secs` (e.g. 60) instead of the large value used for the linkage test.

---

## End-to-end cross-asset demo (validated on testnet)

Full product loop proven on-chain with **live Pyth prices**: cross-asset vault
(SUI collateral / TUSD debt) → trustless Pyth read → skim (USD-priced borrow) →
defend (USD-priced auto-repay from buffer).

### testcoins package (testnet faucet coins, not protocol code)

| | ID / type |
|--|--|
| Package | `0xcded297196ec87ca30873b02ccc11c1210817aba5ba125314ab1ccbc79565284` |
| TUSD (debt, 6dp) | `…::tusd::TUSD`, TreasuryCap `0xfd73bd323e51b510006f7c1ea241a91f70983816e7036096f69cacdcffd4d7dc` |
| TBTC (8dp) | `…::tbtc::TBTC`, TreasuryCap `0x880fc3c16f938e9d02952190d71d2c7227b5713ad52d0745753792215bfa1931` |
| TETH (8dp) | `…::teth::TETH`, TreasuryCap `0x5851688db1ed41bd207ea6a9039d10b91a93d014b05dab27b4f96a957ad31e17` |

### Protocol objects created

| Object | ID |
|--|--|
| NativePool&lt;TUSD&gt; (lender) | `0xed90ce6d4fcab83c9558b8b8a9553573951075a12ed0894542eeb874cdcfdb62` |
| ShadowPool&lt;TUSD&gt; (spendable) | `0x5b2caab9158c4a776cefef3412cf2a4a5bf33423733fbc245f9d7c43be7bf69d` |
| AgentCap | `0xb3a6d43cb9e492dae86703ef541c26785fdecd465c0e85921c3a152a6d235fff` |
| OracleCap (keeper fallback) | `0xddf3f7db32d30ad10ee812d8b86d36e55ae08653806cb1eed48182a979b9989c` |
| Vault&lt;SUI,TUSD&gt; (demo) | `0x29c700a79e9ba19902235ceb5dec464e8577aed1e82c8381d79e81c17e7e0aa6` |
| AgentState (demo) | `0xf0c7fa9cbd4e9ce4ce3e02a2a59c207a804f7c1b80f6eb9ae21518f22f2a54ef` |

### Registered assets

SUI (`0x2::sui::SUI`, 9dp, LTV 60% / liq 80%) · TUSD (debt, 6dp) · TBTC (8dp,
LTV 70/85) · TETH (8dp, LTV 75/90). BTC + ETH + SUI prices all refreshed live
from Pyth into the cache (`refresh_from_pyth`).

### Demo flow + result

1. `set_price<TUSD>` = $1 (keeper) · `refresh_from_pyth<SUI>` = live (~$0.75).
2. Fund lender pool 100 TUSD · deposit 0.1 SUI collateral.
3. `skim_to_shadow<SUI,TUSD>` → borrowed **37 435 TUSD** ($0.0374) to spendable
   (USD-priced against the live SUI price).
4. Fund buffer 0.05 TUSD · raise `min_hf` to 2.0× · `defend<SUI,TUSD>`.
5. Result: debt **37 435 → 29 948**, buffer **50 000 → 42 513** (repaid **7 487**
   from buffer); **HF restored to exactly 2.0×** (the defense line).

All txs permissionless/agent-gated as designed; prices live from Pyth on-chain.
