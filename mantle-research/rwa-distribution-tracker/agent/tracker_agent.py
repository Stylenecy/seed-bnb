#!/usr/bin/env python3
"""
RWA Distribution Tracker automation agent (BNB Chain).

Three jobs in one run:
  1. DIGEST: weekly markdown research brief (reports/YYYY-MM-DD.md)
  2. ALERTS: webhook ping when a falsifiable threshold is crossed
  3. SYNC:   cross-check Dune query results vs live BscScan (Etherscan v2) API (optional)

Stdlib only. Run: python3 tracker_agent.py [--alerts-only]
Env: ETHERSCAN_API_KEY (BscScan via Etherscan API v2), ALERT_WEBHOOK_URL (optional), DUNE_API_KEY (optional)
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
UA = {"User-Agent": "bnb-rwa-tracker/1.0", "Content-Type": "application/json"}


def get(url, headers=None):
    try:
        req = urllib.request.Request(url, headers={**UA, **(headers or {})})
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"[warn] fetch failed {url}: {e}", file=sys.stderr)
        return None


def post(url, payload):
    try:
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode(), headers=UA, method="POST"
        )
        urllib.request.urlopen(req, timeout=20)
        return True
    except Exception as e:
        print(f"[warn] webhook failed: {e}", file=sys.stderr)
        return False


def token_snapshot(cfg, address, issuer):
    """Live snapshot from BscScan (Etherscan API v2, chainid=56): holder count, top-1 %, issuer %.

    Uses module=token&action=tokenholderlist (paginated) plus module=stats&action=tokensupply.
    Needs an Etherscan/BscScan API key in the env var named by cfg["explorer_api_key_env"].
    Note: tokenholderlist may require a paid Etherscan API plan; without access this returns None.
    """
    key = os.environ.get(cfg.get("explorer_api_key_env", "ETHERSCAN_API_KEY"))
    if not key:
        print("[warn] no explorer API key set; skipping live holder snapshot", file=sys.stderr)
        return None
    base = (f"https://api.etherscan.io/v2/api?chainid={cfg['chain_id']}"
            f"&contractaddress={address}&apikey={key}")
    sup = get(base + "&module=stats&action=tokensupply")
    try:
        total = int(sup["result"])
    except (TypeError, KeyError, ValueError):
        print(f"[warn] tokensupply failed for {address}: {sup}", file=sys.stderr)
        return None
    items, page, per_page, max_pages = [], 1, 100, 10
    while page <= max_pages:  # ponytail: 10-page cap = exact up to 1000 holders, then lower bound
        d = get(base + f"&module=token&action=tokenholderlist&page={page}&offset={per_page}")
        res = d.get("result") if d else None
        if not isinstance(res, list) or not res:
            break
        items += res
        if len(res) < per_page:
            break
        page += 1
    if not items or total <= 0:
        return None
    bal = {i.get("TokenHolderAddress", "").lower(): int(i.get("TokenHolderQuantity", 0))
           for i in items}
    top1 = 100.0 * max(bal.values()) / total
    issuer_bal = bal.get(issuer.lower())
    return {
        "holders": len(items),
        "holders_exact": page <= max_pages,  # False = hit page cap, count is a lower bound
        "top1_pct": round(top1, 3),
        "issuer_pct": round(100.0 * issuer_bal / total, 3) if issuer_bal is not None else None,
        "external_float_pct": round(100 - top1, 3),
    }


def chain_tvl(cfg):
    chains = get("https://api.llama.fi/v2/chains") or []
    # DeFiLlama lists several entries per chainId (e.g. "BSC" and a 0-TVL "Binance" for 56); take the largest.
    tvls = [c.get("tvl") or 0 for c in chains if c.get("chainId") == cfg["chain_id"]]
    return max(tvls) if tvls else None


def dune_check(cfg, live):
    """Compare Dune query result vs live API; return list of divergence notes."""
    key = os.environ.get("DUNE_API_KEY")
    dune = cfg.get("dune", {})
    if not (dune.get("enabled") and key):
        return []
    notes = []
    qid = dune["query_ids"].get("concentration")
    if not qid:
        return []
    d = get(
        f"https://api.dune.com/api/v1/query/{qid}/results?limit=1",
        headers={"X-Dune-API-Key": key},
    )
    try:
        row = d["result"]["rows"][0]
        dune_top1 = float(row["top1_pct"])
        for sym, snap in live.items():
            if snap and abs(dune_top1 - snap["top1_pct"]) > dune["max_divergence_pts"]:
                notes.append(
                    f"⚠️ Dune vs API divergence for {sym}: Dune {dune_top1:.2f}% "
                    f"vs live {snap['top1_pct']:.2f}%. Refresh the Dune query."
                )
    except (TypeError, KeyError, IndexError):
        notes.append("⚠️ Could not read Dune results. Check query ID / API key.")
    return notes


def _holders(snap):
    """Holder count from a snapshot; tolerates pre-rename state files."""
    return snap.get("holders", snap.get("sampled_holders", 0))


def build_alerts(cfg, sym, prev, cur):
    t = cfg["thresholds"]
    alerts = []
    if not cur:
        return alerts
    if cur["top1_pct"] < t["top1_pct_target"]:
        alerts.append(f"🚨 {sym}: top wallet below {t['top1_pct_target']}% "
                      f"({cur['top1_pct']}%). Distribution threshold CROSSED.")
    if _holders(cur) >= t["holders_target"] and (not prev or _holders(prev) < t["holders_target"]):
        alerts.append(f"🎯 {sym}: holders reached {t['holders_target']}+ "
                      f"({_holders(cur)}). Distribution threshold CROSSED.")
    if prev:
        drop = prev["top1_pct"] - cur["top1_pct"]
        if drop >= t["alert_on_top1_drop_pts"]:
            alerts.append(f"📉 {sym}: top wallet -{drop:.2f} pts since last run "
                          f"({prev['top1_pct']}% to {cur['top1_pct']}%).")
        jump = _holders(cur) - _holders(prev)
        if jump >= t["alert_on_holder_jump"]:
            alerts.append(f"📈 {sym}: +{jump} holders since last run.")
    return alerts


def digest_md(cfg, live, tvl, prev_state, alerts, sync_notes):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    L = [f"# BNB Chain RWA Distribution Digest, {now}",
         "", "*Auto-generated by tracker_agent.py. Not financial advice.*", ""]
    if tvl:
        L += [f"**BNB Chain DeFi TVL:** ${tvl:,.0f} (DeFiLlama)", ""]
    L += ["| Token | Top-1 wallet | External float | Holders | Δ top-1 vs last run |",
          "|---|---|---|---|---|"]
    for sym, snap in live.items():
        if not snap:
            L.append(f"| {sym} | data unavailable | n/a | n/a | n/a |")
            continue
        prev = prev_state.get(sym)
        delta = (f"{prev['top1_pct'] - snap['top1_pct']:+.2f} pts"
                 if prev else "first run")
        holders = f"{_holders(snap)}{'' if snap.get('holders_exact', True) else '+'}"
        L.append(f"| {sym} | {snap['top1_pct']}% | {snap['external_float_pct']}% "
                 f"| {holders} | {delta} |")
    L += ["", "## Thresholds (falsifiable)", ""]
    t = cfg["thresholds"]
    for sym, snap in live.items():
        if snap:
            check = "✅" if snap["top1_pct"] < t["top1_pct_target"] else "⬜"
            L.append(f"- {check} {sym}: top wallet < {t['top1_pct_target']}% "
                     f"(now {snap['top1_pct']}%)")
            check = "✅" if _holders(snap) >= t["holders_target"] else "⬜"
            L.append(f"- {check} {sym}: holders > {t['holders_target']} "
                     f"(now {_holders(snap)})")
    if alerts:
        L += ["", "## Alerts", ""] + [f"- {a}" for a in alerts]
    if sync_notes:
        L += ["", "## Dune sync check", ""] + [f"- {n}" for n in sync_notes]
    L += ["", "## Sources", "",
          f"- BscScan via Etherscan API v2 (BNB Chain, chainId {cfg['chain_id']}), DeFiLlama /v2/chains",
          f"- Generated {now}"]
    return "\n".join(L)


def main():
    alerts_only = "--alerts-only" in sys.argv
    cfg = json.loads((HERE / "config.json").read_text())
    state_path = HERE / cfg["state_file"]
    prev_state = json.loads(state_path.read_text()) if state_path.exists() else {}

    live, all_alerts = {}, []
    for sym, tok in cfg["tokens"].items():
        snap = token_snapshot(cfg, tok["address"], tok["issuer_wallet"])
        live[sym] = snap
        all_alerts += build_alerts(cfg, sym, prev_state.get(sym), snap)

    sync_notes = dune_check(cfg, live)
    webhook = os.environ.get(cfg["webhook_env_var"])
    if webhook and (all_alerts or sync_notes):
        post(webhook, {"content": "\n".join(all_alerts + sync_notes)})

    if not alerts_only:
        tvl = chain_tvl(cfg)
        report = digest_md(cfg, live, tvl, prev_state, all_alerts, sync_notes)
        rdir = HERE / cfg["reports_dir"]
        rdir.mkdir(exist_ok=True)
        out = rdir / f"{datetime.now(timezone.utc):%Y-%m-%d}.md"
        out.write_text(report)
        print(f"digest written: {out}")

    # persist state for next-run deltas
    state_path.write_text(json.dumps(
        {k: v for k, v in live.items() if v}, indent=2))
    print("alerts:", len(all_alerts), "| sync notes:", len(sync_notes))


if __name__ == "__main__":
    main()
