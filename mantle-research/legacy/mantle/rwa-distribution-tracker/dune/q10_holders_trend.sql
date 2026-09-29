-- Q10: xStock holders over time (ecosystem). Is the gap closing or widening?
-- Live: https://dune.com/queries/7865851  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Weekly count of distinct external wallets holding ANY xStock (exact end-of-week balance > 0),
-- plus wallets holding their first xStock that week. Issuer + zero address excluded.
-- Result 2026-07-02: 926 holders total; +816 (88%) arrived in ONE 4-week window
-- (Apr 13 - May 10, 2026); single-digit weekly growth since. Distribution is event-driven.
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
      AND holder <> 0x5f7a4c11bde4f218f0025ef444c369d838ffa2ad  -- issuer
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
    HAVING MAX(bal) > 0        -- wallet holds at least one xStock at end of week
),
firsts AS (
    SELECT holder, MIN(wk) AS first_wk FROM holder_weeks GROUP BY 1
)
SELECT
    hw.wk,
    CAST(COUNT(*) AS bigint) AS external_holders,
    CAST(COUNT(*) FILTER (WHERE f.first_wk = hw.wk) AS bigint) AS first_time_holders
FROM holder_weeks hw
JOIN firsts f ON f.holder = hw.holder
GROUP BY 1
ORDER BY 1
