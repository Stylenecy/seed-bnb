"""End-to-end smoke test of the BNB Chain integration against live BSC Testnet.

Registers an agent, records a fake settled trade, reads it back. Exits 0 on
full success, prints actionable error otherwise.

Run from project root:
    /path/to/python bridgeagent/scripts/bnb_smoke_test.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

# Make bridgeagent importable when run directly.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

# Load contracts/.env so BNB_* vars are available.
from dotenv import load_dotenv
contracts_env = Path(__file__).resolve().parents[2] / "contracts" / ".env"
if contracts_env.is_file():
    load_dotenv(contracts_env)
    print(f"loaded env from {contracts_env}")
else:
    print(f"WARNING: {contracts_env} not found — relying on shell env")

# bridgeagent's config module reads env at import time, so the dotenv load
# above must happen first. Then we map the contracts/.env keys onto the
# names config.py expects.
if os.environ.get("PRIVATE_KEY"):
    os.environ.setdefault("BNB_PRIVATE_KEY", os.environ["PRIVATE_KEY"])

from bridgeagent.bnb import (
    IdentityClient,
    BnbClient,
    TradeJournalClient,
)
from bridgeagent.bnb.identity import MetadataEntry
from bridgeagent.bnb.trade_journal import SettledTrade


def main() -> int:
    bnb = BnbClient.from_config()
    if bnb is None:
        print("FAIL: BnbClient.from_config() returned None — check env vars")
        return 1

    print(f"connected to chain {bnb.chain_id} as {bnb.address}")
    print(f"  balance: {bnb.get_balance():.4f} BNB")

    identity = IdentityClient(bnb)
    pre_total = identity.total_agents()
    print(f"  agents already registered: {pre_total}")

    # 1) Register a fresh agent
    agent_uri = f"https://bridgeagent.local/agents/smoke-{int(time.time())}.json"
    metadata = [
        MetadataEntry(key="venue", value=b"hyperliquid"),
        MetadataEntry(key="bootstrap", value=b"smoke-test"),
    ]
    print(f"\nregistering agent with uri={agent_uri} ...")
    agent_id = identity.register_agent(agent_uri, metadata)
    print(f"  -> agent_id = {agent_id}")
    assert agent_id == pre_total + 1, "agent_id should be pre_total + 1"

    # 2) Read it back
    print("\nreading agent state back...")
    print(f"  ownerOf({agent_id})       = {identity.owner_of(agent_id)}")
    print(f"  tokenURI({agent_id})      = {identity.get_agent_uri(agent_id)}")
    print(f"  metadata(venue)           = {identity.get_metadata(agent_id, 'venue')!r}")
    print(f"  totalAgents               = {identity.total_agents()}")

    # 3) Record a fake trade through the queue + flush, then read it back
    journal = TradeJournalClient(bnb, agent_id=agent_id)
    fake_trade = SettledTrade(
        coin="BTC",
        entry_px=100_000.0,
        exit_px=101_500.0,
        size=0.01,
        side="buy",
        opened_at=int(time.time()) - 3600,
        closed_at=int(time.time()),
        pnl_pct=0.015,
    )
    print(f"\nrecording fake trade: {fake_trade.coin} +1.5% PnL ...")
    tx_hash = journal.record_now(fake_trade)
    print(f"  -> tx = {tx_hash}")

    print("\nreading trade journal back...")
    print(f"  totalTrades              = {journal.total_trades()}")
    print(f"  tradeCountByAgent({agent_id}) = {journal.trade_count_by_agent()}")
    trades = journal.trades_by_agent(0, 10)
    for t in trades:
        print(f"    {t}")
    assert len(trades) == 1
    assert trades[0]["pnl_bps"] == 150, f"expected 150 bps, got {trades[0]['pnl_bps']}"

    print(f"\nSUCCESS — smoke test complete. Save BNB_AGENT_ID={agent_id} to your .env")
    return 0


if __name__ == "__main__":
    sys.exit(main())
