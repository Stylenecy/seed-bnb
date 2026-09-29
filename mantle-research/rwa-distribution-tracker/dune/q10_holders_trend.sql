-- Q10: xStock holders over time (ecosystem). Is the gap closing or widening?
-- Live: TODO re-publish on Dune for BNB Chain (Mantle original: see legacy/mantle)
-- Weekly count of distinct external wallets holding ANY xStock (exact end-of-week balance > 0),
-- plus wallets holding their first xStock that week. {{issuer_wallet}} + zero address excluded.
WITH universe AS (
    SELECT contract_address
    FROM tokens.erc20
    WHERE blockchain = 'bnb' AND lower(name) LIKE '%xstock%'
    GROUP BY 1
),
xfers AS (
    SELECT l.contract_address,
           bytearray_substring(l.topic1, 13, 20) AS from_addr,
           bytearray_substring(l.topic2, 13, 20) AS to_addr,
           date_trunc('week', l.block_time) AS wk,
           CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM bnb.logs l
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
      AND holder <> {{issuer_wallet}}  -- issuer
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
