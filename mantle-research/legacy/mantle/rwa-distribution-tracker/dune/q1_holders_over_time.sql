-- Q1: Holder count over time for one RWA token on Mantle
-- Live: https://dune.com/queries/7863651  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Dashboard widget: line chart (day vs holders, and holders holding >= 1 whole token)
-- Param: {{token_address}}, default SPCXx 0x68fa48b1c2fe52b3d776e1953e0e782b5044ce28
-- Table: mantle.logs (raw, always available; no decoding needed). Exact decimal(38,0) balances.
WITH flows AS (
    SELECT block_time, bytearray_substring(topic1, 13, 20) AS holder,
           -CAST(bytearray_to_uint256(data) AS decimal(38,0)) AS amt
    FROM mantle.logs
    WHERE contract_address = {{token_address}}
      AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    UNION ALL
    SELECT block_time, bytearray_substring(topic2, 13, 20) AS holder,
            CAST(bytearray_to_uint256(data) AS decimal(38,0)) AS amt
    FROM mantle.logs
    WHERE contract_address = {{token_address}}
      AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
daily_net AS (
    SELECT date_trunc('day', block_time) AS day, holder, SUM(amt) AS net
    FROM flows
    WHERE holder <> 0x0000000000000000000000000000000000000000
    GROUP BY 1, 2
),
spine AS (SELECT DISTINCT day FROM daily_net),
hodlers AS (SELECT DISTINCT holder FROM daily_net),
-- carry each holder's cumulative balance across all days (small token: ~holders x days cells)
bal AS (
    SELECT s.day, h.holder,
           SUM(COALESCE(d.net, 0)) OVER (PARTITION BY h.holder ORDER BY s.day) AS balance
    FROM spine s
    CROSS JOIN hodlers h
    LEFT JOIN daily_net d ON d.day = s.day AND d.holder = h.holder
)
SELECT
    day,
    CAST(COUNT(*) FILTER (WHERE balance > 0) AS bigint)                    AS holders,
    CAST(COUNT(*) FILTER (WHERE balance >= 1000000000000000000) AS bigint) AS holders_ge_1token
FROM bal
GROUP BY 1
ORDER BY 1
