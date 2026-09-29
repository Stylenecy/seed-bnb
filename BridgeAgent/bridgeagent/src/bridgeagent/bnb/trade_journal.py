"""TradeJournal helper — append-only on-chain log of settled trades.

Settlement frequency in BridgeAgent's loop is irregular (whenever a position
closes). To keep gas spend bounded and avoid one-tx-per-trade overhead, we
queue settled trades and flush them as separate `record()` txs at most once
per `BNB_FLUSH_INTERVAL` seconds. Each `record()` is its own tx (the
contract's API is single-trade-per-call), but they're submitted in a tight
loop within the flush window so they share the same RPC connection.

Hash format (must match any client reproducing it):
    tradeHash = keccak256(abi.encode(
        string  coin,
        uint256 entry_px_e8,   # entry price * 1e8
        uint256 exit_px_e8,    # exit price * 1e8
        int256  size_e8,       # signed size * 1e8 (positive = long, negative = short)
        uint8   side,          # 0 = buy/long entry, 1 = sell/short entry
        uint64  opened_at,
        uint64  closed_at,
    ))
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass
from typing import List, Literal

from eth_abi import encode as abi_encode
from eth_utils import keccak

from bridgeagent.bnb.client import BnbClient

logger = logging.getLogger(__name__)

# Hyperliquid stores prices/sizes as floats but with effectively 1e8 precision.
# We scale to ints for hashing so Solidity / TS clients can reproduce the hash.
PRICE_SCALE = 10 ** 8
SIZE_SCALE = 10 ** 8


@dataclass
class SettledTrade:
    coin: str
    entry_px: float
    exit_px: float
    size: float            # signed: positive = long position closed, negative = short closed
    side: Literal["buy", "sell", "long", "short"]
    opened_at: int          # unix seconds
    closed_at: int          # unix seconds
    pnl_pct: float          # signed PnL as a percent (e.g. 0.0123 = +1.23%)


def compute_trade_hash(t: SettledTrade) -> bytes:
    """Deterministic 32-byte hash of a settled trade."""
    side_int = 0 if t.side.lower() in ("buy", "long") else 1
    encoded = abi_encode(
        ["string", "uint256", "uint256", "int256", "uint8", "uint64", "uint64"],
        [
            t.coin,
            int(round(t.entry_px * PRICE_SCALE)),
            int(round(t.exit_px * PRICE_SCALE)),
            int(round(t.size * SIZE_SCALE)),
            side_int,
            t.opened_at,
            t.closed_at,
        ],
    )
    return keccak(encoded)


def pnl_to_bps(pnl_pct: float) -> int:
    """Convert a fractional PnL (0.0123 = +1.23%) to integer basis points.

    Accepts either fractional (0.0123) or percent (1.23) — we detect the
    likely scale from magnitude. Anything with |x| > 1.0 is assumed to
    already be in percent.
    """
    pct = pnl_pct * 100 if abs(pnl_pct) <= 1.0 else pnl_pct
    return int(round(pct * 100))  # 1% = 100 bps


class TradeJournalClient:
    """High-level wrapper over the on-chain TradeJournal contract.

    Owns a small in-memory queue. The runtime calls `enqueue(trade)` from the
    hot path (cheap, just an append) and a background task calls `flush()`
    every BNB_FLUSH_INTERVAL seconds.
    """

    def __init__(self, bnb: BnbClient, agent_id: int):
        if agent_id <= 0:
            raise ValueError("agent_id must be a positive integer")
        self.bnb = bnb
        self.contract = bnb.trade_journal
        self.agent_id = agent_id
        self._queue: List[SettledTrade] = []
        self._lock = threading.Lock()

    # ---- enqueue / flush ----

    def enqueue(self, trade: SettledTrade) -> None:
        with self._lock:
            self._queue.append(trade)

    def queue_size(self) -> int:
        with self._lock:
            return len(self._queue)

    def flush(self) -> List[str]:
        """Submit every queued trade as its own record() tx. Returns the list
        of tx hashes (one per trade, in submission order). Errors on individual
        trades are logged and dropped — the rest of the queue still flushes."""
        with self._lock:
            pending, self._queue = self._queue, []

        tx_hashes: List[str] = []
        for trade in pending:
            try:
                tx_hash = self._record_one(trade)
                tx_hashes.append(tx_hash)
            except Exception:
                logger.exception(
                    "TradeJournal.record failed for %s — dropping",
                    trade.coin,
                )
        if tx_hashes:
            logger.info(
                "TradeJournal flush: %d trade(s) recorded on-chain",
                len(tx_hashes),
            )
        return tx_hashes

    # ---- single-trade write (used by flush, exposed for smoke tests) ----

    def _record_one(self, trade: SettledTrade) -> str:
        trade_hash = compute_trade_hash(trade)
        pnl_bps = pnl_to_bps(trade.pnl_pct)
        fn = self.contract.functions.record(
            self.agent_id,
            trade_hash,
            pnl_bps,
            trade.closed_at,
        )
        tx_hash = self.bnb.send(fn)
        self.bnb.wait(tx_hash)
        logger.debug(
            "TradeJournal recorded: agent=%s coin=%s pnl_bps=%d tx=%s",
            self.agent_id, trade.coin, pnl_bps, tx_hash,
        )
        return tx_hash

    def record_now(self, trade: SettledTrade) -> str:
        """Bypass the queue and submit immediately. Useful for smoke tests
        and the very first trade after onboarding (so judges see something
        on-chain quickly during a demo)."""
        return self._record_one(trade)

    # ---- reads ----

    def total_trades(self) -> int:
        return int(self.contract.functions.totalTrades().call())

    def trade_count_by_agent(self) -> int:
        return int(
            self.contract.functions.tradeCountByAgent(self.agent_id).call()
        )

    def trades_by_agent(self, offset: int = 0, limit: int = 50) -> List[dict]:
        """Page through this agent's trades. Returns a list of dicts with the
        on-chain TradeRecord fields. Useful for the web companion read path
        and for reconciliation."""
        raw = self.contract.functions.tradesByAgent(
            self.agent_id, offset, limit
        ).call()
        # Each row is (uint256 agentId, bytes32 tradeHash, int256 pnlBps, uint64 closedAt)
        return [
            {
                "agent_id": int(row[0]),
                "trade_hash": "0x" + row[1].hex(),
                "pnl_bps": int(row[2]),
                "closed_at": int(row[3]),
            }
            for row in raw
        ]
