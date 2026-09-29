-- Q6: DEX trading activity for an RWA token on BNB Chain
-- Live: TODO re-publish on Dune for BNB Chain (Mantle original: see legacy/mantle)
-- Dashboard widget: stacked column (weekly trades per venue).
-- Coverage: dex.trades on BNB Chain covers PancakeSwap and other indexed BSC DEXs. TODO verify the
--   project list for your token. Long-tail RWAs may be missing from the DEX price oracle (amount_usd NULL),
--   so we chart TRADE COUNTS (and unique traders), not USD. Swap to volume_usd for priced tokens.
-- Param: {{token_address}}
SELECT
    date_trunc('week', block_time)        AS week,
    project,
    CAST(COUNT(*) AS bigint)              AS trades,
    CAST(COUNT(DISTINCT taker) AS bigint) AS unique_traders,
    SUM(amount_usd)                       AS volume_usd   -- NULL for tokens absent from the price oracle
FROM dex.trades
WHERE blockchain = 'bnb'
  AND (token_bought_address = {{token_address}} OR token_sold_address = {{token_address}})
GROUP BY 1, 2
ORDER BY 1
