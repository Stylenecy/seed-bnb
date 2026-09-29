#!/usr/bin/env python3
"""
Mantle RWA Research Brief generator.
Stdlib only, no pip install needed. Run: python3 rwa_brief.py > brief.md
Part of the `mantle-rwa-research` Agent Skill (Mantle Research Challenge, Track 2).
"""
import json
import urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "mantle-rwa-research-skill/1.0"}
SPCXX = "0x68fa48b1c2fe52b3d776e1953e0e782b5044ce28"  # SPCXx on Mantle
MANTLE_CHAIN_ID = 5000


def get(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"<!-- fetch failed: {url} ({e}) -->")
        return None


def mantle_tvl():
    chains = get("https://api.llama.fi/v2/chains") or []
    for c in chains:
        if c.get("chainId") == MANTLE_CHAIN_ID:
            return c.get("tvl")
    return None


def prices():
    d = get(
        "https://api.coingecko.com/api/v3/simple/price"
        "?ids=mantle,spacex-xstock&vs_currencies=usd&include_market_cap=true"
    )
    return d or {}


def holders(contract, limit=25):
    d = get(
        f"https://api.routescan.io/v2/network/mainnet/evm/{MANTLE_CHAIN_ID}"
        f"/erc20/{contract}/holders?limit={limit}"
    )
    if not d:
        return []
    return d.get("items", d if isinstance(d, list) else [])


def concentration(items):
    """Return (holder_count_in_page, top_share_pct) from a Routescan holders page.

    Routescan returns a `percentage` field (share of total supply, 0-1)."""
    shares = []
    for it in items:
        try:
            shares.append(float(it.get("percentage", 0)))
        except (TypeError, ValueError):
            pass
    if not shares:
        return len(items), None
    return len(items), 100.0 * max(shares)


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    tvl = mantle_tvl()
    px = prices()
    hs = holders(SPCXX)
    n, top = concentration(hs)

    mnt = px.get("mantle", {})
    spcxx = px.get("spacex-xstock", {})

    print(f"# Mantle RWA Research Brief\n\n*Generated {now}. Auto-generated, not financial advice.*\n")
    print("## Headline numbers\n")
    print(f"- Mantle DeFi TVL: **${tvl:,.0f}**" if tvl else "- Mantle DeFi TVL: unavailable")
    if mnt.get("usd"):
        print(f"- MNT price: **${mnt['usd']:,.4f}**")
    if spcxx.get("usd"):
        print(f"- SPCXx (tokenized SpaceX) price: **${spcxx['usd']:,.2f}**")
    print("\n## Distribution reality (SPCXx on Mantle)\n")
    if hs:
        print(f"- Holders returned (top page): **{n}**")
        if top is not None:
            print(f"- Top wallet share of sampled supply: **{top:.2f}%**")
            verdict = (
                "ISSUED, NOT ADOPTED. Supply exists but sits with the issuer."
                if top > 75
                else "Distribution improving: top wallet below the 75% threshold."
            )
            print(f"- Verdict: **{verdict}**")
    else:
        print("- Holder data unavailable (check Routescan API).")
    print("\n## Thresholds to watch (falsifiable)\n")
    print("- [ ] SPCXx holders > 500")
    print("- [ ] Top wallet < 75% of supply")
    print("- [ ] Mantle-side DEX liquidity > $100K")
    print("\n## Sources\n")
    print("- DeFiLlama /v2/chains, CoinGecko simple/price, Routescan v2 API")
    print(f"- SPCXx contract: `{SPCXX}` (Mantle, chainId {MANTLE_CHAIN_ID})")


if __name__ == "__main__":
    main()
