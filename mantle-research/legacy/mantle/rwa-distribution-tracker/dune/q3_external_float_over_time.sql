-- Q3: External float over time. The core distribution metric (hero chart).
-- Live: https://dune.com/queries/7863645  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- % of net supply held OUTSIDE the issuer/deployer wallet. Shows whether the token is being
-- distributed or just minted-and-parked. Dashboard widget: area chart (day vs external_float_pct).
-- Params:
--   {{token_address}}: default 0x68fa48b1c2fe52b3d776e1953e0e782b5044ce28 (SPCXx)
--   {{issuer_wallet}}: default 0x5f7a4c11bde4f218f0025ef444c369d838ffa2ad (Backed/xStocks deployer)
-- supply_delta uses the zero-address side of each Transfer (mint = +, burn = -). Exact decimal math.
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
daily AS (
    SELECT date_trunc('day', block_time) AS day,
           SUM(CASE WHEN holder = 0x0000000000000000000000000000000000000000 THEN -amt ELSE 0 END) AS supply_delta,
           SUM(CASE WHEN holder = {{issuer_wallet}} THEN amt ELSE 0 END) AS issuer_delta
    FROM flows
    GROUP BY 1
)
SELECT
    day,
    CAST(SUM(supply_delta) OVER (ORDER BY day) AS double) / 1e18 AS total_supply,
    CAST(SUM(issuer_delta) OVER (ORDER BY day) AS double) / 1e18 AS issuer_balance,
    ROUND(100.0 * (1 - CAST(SUM(issuer_delta) OVER (ORDER BY day) AS double)
                       / NULLIF(CAST(SUM(supply_delta) OVER (ORDER BY day) AS double), 0)), 3) AS external_float_pct
FROM daily
ORDER BY day
