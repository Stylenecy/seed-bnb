-- Q2: Current holder concentration for one RWA token on Mantle
-- Live: https://dune.com/queries/7863618  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Dashboard widgets: counters (holders, top-1 %, external float %) + net supply
-- Params: {{token_address}} default SPCXx 0x68fa...ce28 ; {{issuer_wallet}} default 0x5f7a...a2aD
--
-- Balances are reconstructed in exact 256-bit integer math via decimal(38,0), not double.
-- double loses integer precision above ~2^53, which is why the old ">1e6 dust" hack existed;
-- with exact math a zero balance is exactly zero and holder counts are exact.
WITH flows AS (
    SELECT bytearray_substring(topic1, 13, 20) AS holder,
           -CAST(bytearray_to_uint256(data) AS decimal(38,0)) AS amt   -- outgoing
    FROM mantle.logs
    WHERE contract_address = {{token_address}}
      AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    UNION ALL
    SELECT bytearray_substring(topic2, 13, 20) AS holder,
            CAST(bytearray_to_uint256(data) AS decimal(38,0)) AS amt   -- incoming
    FROM mantle.logs
    WHERE contract_address = {{token_address}}
      AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
balances AS (
    SELECT holder, SUM(amt) AS bal
    FROM flows
    WHERE holder <> 0x0000000000000000000000000000000000000000
    GROUP BY 1
    HAVING SUM(amt) > 0
),
ranked AS (
    SELECT holder, bal,
           ROW_NUMBER() OVER (ORDER BY bal DESC) AS rnk,
           SUM(bal) OVER () AS total
    FROM balances
)
SELECT
    COUNT(*)                                                                              AS holders,
    CAST(COUNT(*) FILTER (WHERE bal >= 1000000000000000000) AS bigint)                    AS holders_ge_1token,
    ROUND(100.0 * CAST(MAX(bal) FILTER (WHERE rnk = 1) AS double) / CAST(MAX(total) AS double), 2)                          AS top1_pct,
    ROUND(100.0 * CAST(SUM(bal) FILTER (WHERE rnk <= 10) AS double) / CAST(MAX(total) AS double), 2)                        AS top10_pct,
    ROUND(100.0 * CAST(SUM(bal) FILTER (WHERE holder = {{issuer_wallet}}) AS double) / CAST(MAX(total) AS double), 2)       AS issuer_pct,
    ROUND(100.0 * (1 - CAST(SUM(bal) FILTER (WHERE holder = {{issuer_wallet}}) AS double) / CAST(MAX(total) AS double)), 2) AS external_float_pct,
    ROUND(CAST(MAX(total) AS double) / 1e18, 2)                                           AS net_supply_tokens
FROM ranked
