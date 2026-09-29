"""
Shared candle cache to prevent venue API rate-limiting (HTTP 429).

Candles don't change within their interval window, so we cache them
with a TTL tied to the interval. E.g. 4h candles only need refresh
every ~5-15 min; 1h candles every ~1-5 min.

Thread-safe via a single asyncio.Lock per (coin, interval) key.
"""

import asyncio
import logging
import time
from typing import Dict, List, Tuple

from bridgeagent.venue.base import Venue

logger = logging.getLogger(__name__)


_INTERVAL_TTL = {
    "1m": 15,
    "5m": 30,
    "15m": 90,
    "30m": 180,
    "1h": 300,
    "4h": 900,
    "1d": 3600,
}


class CandleCache:

    def __init__(self, venue: Venue):
        self.venue = venue
        self._cache: Dict[Tuple[str, str], Tuple[float, List[dict]]] = {}
        self._locks: Dict[Tuple[str, str], asyncio.Lock] = {}

    def _get_lock(self, key: Tuple[str, str]) -> asyncio.Lock:
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    async def get(
        self, coin: str, interval: str, count: int
    ) -> List[dict]:
        key = (coin, interval)
        ttl = _INTERVAL_TTL.get(interval, 300)
        now = time.time()

        cached = self._cache.get(key)
        if cached is not None:
            age, candles = now - cached[0], cached[1]
            if age < ttl and len(candles) >= count:
                return candles[-count:] if count else candles

        lock = self._get_lock(key)
        async with lock:
            # Double-check under lock
            cached = self._cache.get(key)
            if cached is not None:
                age, candles = now - cached[0], cached[1]
                if age < ttl and len(candles) >= count:
                    return candles[-count:] if count else candles

            try:
                candles = await self.venue.get_candles(coin, interval, count)
                candles = candles or []
                self._cache[key] = (now, candles)
                return candles
            except Exception as e:
                logger.debug(
                    f"Candle fetch failed for {coin} {interval}: {e}"
                )
                if cached is not None:
                    return cached[1]
                return []
