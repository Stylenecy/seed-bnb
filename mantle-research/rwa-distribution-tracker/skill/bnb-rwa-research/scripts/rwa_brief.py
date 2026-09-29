#!/usr/bin/env python3
"""
BNB Chain RWA Research Brief generator.
Stdlib only, no pip install needed. Run: python3 rwa_brief.py > brief.md
Part of the `bnb-rwa-research` Agent Skill.

Env:
  RWA_TOKEN          BEP-20 RWA token address on BNB Chain (required for the distribution section)
  RWA_COINGECKO_ID   optional CoinGecko id of that token, for the price line
  ETHERSCAN_API_KEY  Etherscan API v2 key (BscScan data via chainid=56)
"""
import json
import os
import urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "bnb-rwa-research-skill/1.0"}
BNB_CHAIN_ID = 56
RWA_TOKEN = os.environ.get("RWA_TOKEN", "")  # TODO: set a default BNB Chain RWA token once chosen
RWA_COINGECKO_ID = os.environ.get("RWA_COINGECKO_ID", "")
API_KEY = os.environ.get("ETHERSCAN_API_KEY", "")


def get(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"<!-- fetch failed: {url.split('apikey=')[0]} ({e}) -->")
        return None


def chain_tvl():
    chains = get("https://api.llama.fi/v2/chains") or []
    # DeFiLlama has several entries for chainId 56 ("BSC" and a 0-TVL "Binance"); take the largest.
    tvls = [c.get("tvl") or 0 for c in chains if c.get("chainId") == BNB_CHAIN_ID]
    return max(tvls) if tvls else None


def prices():
    ids = ",".join(i for i in ["binancecoin", RWA_COINGECKO_ID] if i)
    d = get(
        "https://api.coingecko.com/api/v3/simple/price"
        f"?ids={ids}&vs_currencies=usd&include_market_cap=true"
    )
    return d or {}


def concentration(contract, limit=100):
    """Return (holder_count_in_page, top_share_pct) from BscScan via Etherscan API v2.

    tokenholderlist may require a paid Etherscan API plan."""
    base = (f"https://api.etherscan.io/v2/api?chainid={BNB_CHAIN_ID}"
            f"&contractaddress={contract}&apikey={API_KEY}")
    sup = get(base + "&module=stats&action=tokensupply")
    hl = get(base + f"&module=token&action=tokenholderlist&page=1&offset={limit}")
    try:
        total = int(sup["result"])
        items = hl["result"]
        assert isinstance(items, list)
    except (TypeError, KeyError, ValueError, AssertionError):
        return 0, None
    if not items or total <= 0:
        return len(items), None
    top = max(int(i.get("TokenHolderQuantity", 0)) for i in items)
    return len(items), 100.0 * top / total


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    tvl = chain_tvl()
    px = prices()
    bnb = px.get("binancecoin", {})
    rwa = px.get(RWA_COINGECKO_ID, {}) if RWA_COINGECKO_ID else {}

    print(f"# BNB Chain RWA Research Brief\n\n*Generated {now}. Auto-generated, not financial advice.*\n")
    print("## Headline numbers\n")
    print(f"- BNB Chain DeFi TVL: **${tvl:,.0f}**" if tvl else "- BNB Chain DeFi TVL: unavailable")
    if bnb.get("usd"):
        print(f"- BNB price: **${bnb['usd']:,.2f}**")
    if rwa.get("usd"):
        print(f"- {RWA_COINGECKO_ID} price: **${rwa['usd']:,.2f}**")

    print("\n## Distribution reality\n")
    if not RWA_TOKEN:
        print("- Set RWA_TOKEN to a BEP-20 RWA token address to compute distribution.")
    elif not API_KEY:
        print("- Set ETHERSCAN_API_KEY (Etherscan API v2, used for BscScan) to fetch holders.")
    else:
        n, top = concentration(RWA_TOKEN)
        if n:
            print(f"- Holders returned (top page): **{n}**")
            if top is not None:
                print(f"- Top wallet share of supply: **{top:.2f}%**")
                verdict = (
                    "ISSUED, NOT ADOPTED. Supply exists but sits with the issuer."
                    if top > 75
                    else "Distribution improving: top wallet below the 75% threshold."
                )
                print(f"- Verdict: **{verdict}**")
        else:
            print("- Holder data unavailable (check API key and plan; tokenholderlist may be a paid endpoint).")
    print("\n## Thresholds to watch (falsifiable)\n")
    print("- [ ] Holders > 500")
    print("- [ ] Top wallet < 75% of supply")
    print("- [ ] BNB Chain DEX liquidity (PancakeSwap and others) > $100K")
    print("\n## Sources\n")
    print("- DeFiLlama /v2/chains, CoinGecko simple/price, BscScan via Etherscan API v2")
    if RWA_TOKEN:
        print(f"- Token contract: `{RWA_TOKEN}` (BNB Chain, chainId {BNB_CHAIN_ID})")


if __name__ == "__main__":
    main()
