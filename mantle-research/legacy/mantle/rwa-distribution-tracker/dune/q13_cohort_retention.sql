-- Q13: Bybit-window cohort retention. Did the spike users stick?
-- Live: https://dune.com/queries/7866325  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Of wallets whose FIRST xStock week fell in the Bybit-integration window
-- (April 13 to May 10, 2026), how many still hold any xStock at the latest week?
-- Result 2026-07-02: 802 of 816 = **98.3% retention**. CEX-gateway users are
-- high-quality, buy-and-hold demand, not quest farmers.
WITH universe AS (
    SELECT contract_address
    FROM tokens.erc20
    WHERE blockchain = 'mantle' AND lower(name) LIKE '%xstock%'
    GROUP BY 1
),
xfers AS (
    SELECT l.contract_address,
           bytearray_substring(l.topic1, 13, 20) AS from_addr,
           bytearray_substring(l.topic2, 13, 20) AS to_addr,
           date_trunc('week', l.block_time) AS wk,
           CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM mantle.logs l
    JOIN universe u ON u.contract_address = l.contract_address
    WHERE l.topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
pair_weekly AS (
    SELECT contract_address, holder, wk, SUM(amt) AS net
    FROM (
        SELECT contract_address, from_addr AS holder, wk, -amt AS amt FROM xfers
        UNION ALL
        SELECT contract_address, to_addr AS holder, wk, amt FROM xfers
    )
    WHERE holder <> 0x0000000000000000000000000000000000000000
      AND holder <> 0x5f7a4c11bde4f218f0025ef444c369d838ffa2ad
    GROUP BY 1, 2, 3
),
weeks AS (SELECT DISTINCT wk FROM pair_weekly),
pairs AS (SELECT DISTINCT contract_address, holder FROM pair_weekly),
cells AS (
    SELECT w.wk, p.holder,
           SUM(COALESCE(pw.net, 0)) OVER (
               PARTITION BY p.contract_address, p.holder ORDER BY w.wk
           ) AS bal
    FROM weeks w
    CROSS JOIN pairs p
    LEFT JOIN pair_weekly pw
        ON pw.wk = w.wk AND pw.contract_address = p.contract_address AND pw.holder = p.holder
),
holder_weeks AS (
    SELECT wk, holder
    FROM cells
    GROUP BY 1, 2
    HAVING MAX(bal) > 0
),
firsts AS (
    SELECT holder, MIN(wk) AS first_wk FROM holder_weeks GROUP BY 1
),
latest AS (SELECT MAX(wk) AS wk FROM holder_weeks),
cohort AS (
    SELECT holder FROM firsts
    WHERE first_wk >= timestamp '2026-04-13' AND first_wk < timestamp '2026-05-11'
)
SELECT
    CAST((SELECT COUNT(*) FROM cohort) AS bigint) AS bybit_window_cohort,
    CAST(COUNT(*) AS bigint)                      AS still_holding_now,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM cohort), 1) AS retention_pct
FROM holder_weeks hw
JOIN cohort c ON c.holder = hw.holder
WHERE hw.wk = (SELECT wk FROM latest)
