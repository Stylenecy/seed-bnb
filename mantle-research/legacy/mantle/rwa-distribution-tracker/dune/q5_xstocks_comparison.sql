-- Q5: xStock ecosystem league on Mantle. The thesis at ecosystem scale.
-- Live: https://dune.com/queries/7863671  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Universe = every token on Mantle whose NAME contains "xStock" (Backed's tokenized equities).
-- We match on name, NOT `symbol LIKE '%x'` (that catches junk like 100x / 55X / Arcane Flux).
-- LEFT JOIN keeps xStocks with ZERO on-chain activity, labelled ISSUED, NO HOLDERS.
-- Top holder is the issuer/treasury proxy for external float (no per-token issuer map needed).
-- Dashboard widget: table, sorted by holders DESC. Exact decimal(38,0) balances.
WITH universe AS (
    SELECT contract_address, MAX(symbol) AS symbol, MAX(name) AS name
    FROM tokens.erc20
    WHERE blockchain = 'mantle'
      AND lower(name) LIKE '%xstock%'
    GROUP BY contract_address
),
flows AS (
    SELECT l.contract_address, bytearray_substring(l.topic1, 13, 20) AS holder,
           -CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM mantle.logs l
    JOIN universe u ON u.contract_address = l.contract_address
    WHERE l.topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    UNION ALL
    SELECT l.contract_address, bytearray_substring(l.topic2, 13, 20) AS holder,
            CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM mantle.logs l
    JOIN universe u ON u.contract_address = l.contract_address
    WHERE l.topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
balances AS (
    SELECT contract_address, holder, SUM(amt) AS bal
    FROM flows
    WHERE holder <> 0x0000000000000000000000000000000000000000
    GROUP BY 1, 2
    HAVING SUM(amt) > 0
),
stats AS (
    SELECT contract_address,
           CAST(COUNT(*) AS bigint)                                           AS holders,
           CAST(COUNT(*) FILTER (WHERE bal >= 1000000000000000000) AS bigint) AS holders_ge_1token,
           MAX(bal) AS top_bal,
           SUM(bal) AS total
    FROM balances
    GROUP BY 1
)
SELECT
    u.symbol,
    u.contract_address,
    COALESCE(s.holders, 0)           AS holders,
    COALESCE(s.holders_ge_1token, 0) AS holders_ge_1token,
    ROUND(100.0 * CAST(s.top_bal AS double) / NULLIF(CAST(s.total AS double), 0), 2)       AS top1_pct,
    ROUND(100.0 * (1 - CAST(s.top_bal AS double) / NULLIF(CAST(s.total AS double), 0)), 2) AS external_float_pct,
    CASE
        WHEN s.total IS NULL OR s.total = 0                   THEN 'ISSUED, NO HOLDERS'
        WHEN 100.0 * CAST(s.top_bal AS double) / s.total > 90 THEN 'ISSUED, NOT ADOPTED'
        WHEN 100.0 * CAST(s.top_bal AS double) / s.total > 75 THEN 'CONCENTRATED'
        WHEN s.holders >= 500                                 THEN 'DISTRIBUTED'
        ELSE 'EMERGING'
    END AS verdict
FROM universe u
LEFT JOIN stats s ON s.contract_address = u.contract_address
ORDER BY holders DESC, external_float_pct DESC
