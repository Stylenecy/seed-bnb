-- Q6: DEX trading activity for an RWA token on Mantle
-- Live: https://dune.com/queries/7863658  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Dashboard widget: stacked column (weekly trades per venue).
-- Coverage (verified 2026-07-02): dex.trades covers merchant_moe, agni, uniswap, fusionx on Mantle.
--   * Fluxion is not in the spellbook yet; state this on the dashboard.
--   * SPCXx is NOT in the DEX price oracle, so amount_usd is NULL for it. We therefore chart
--     TRADE COUNTS (and unique traders), not USD. Swap to volume_usd for priced tokens.
-- Param: {{token_address}}
SELECT
    date_trunc('week', block_time)        AS week,
    project,
    CAST(COUNT(*) AS bigint)              AS trades,
    CAST(COUNT(DISTINCT taker) AS bigint) AS unique_traders,
    SUM(amount_usd)                       AS volume_usd   -- NULL for tokens absent from the price oracle
FROM dex.trades
WHERE blockchain = 'mantle'
  AND (token_bought_address = {{token_address}} OR token_sold_address = {{token_address}})
GROUP BY 1, 2
ORDER BY 1
