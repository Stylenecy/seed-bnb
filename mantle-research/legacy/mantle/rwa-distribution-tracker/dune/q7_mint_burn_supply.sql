-- Q7: Mint / burn / net supply over time (NEW)
-- Live: https://dune.com/queries/7863661  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Shows supply is issuer-driven, not demand-driven: mint = Transfer from 0x0, burn = Transfer to 0x0.
-- Dashboard widget: line chart (cum_minted, cum_burned, net_supply). Param: {{token_address}}
WITH flows AS (
    SELECT block_time,
           CASE
               WHEN bytearray_substring(topic1, 13, 20) = 0x0000000000000000000000000000000000000000 THEN 'mint'
               WHEN bytearray_substring(topic2, 13, 20) = 0x0000000000000000000000000000000000000000 THEN 'burn'
           END AS kind,
           CAST(bytearray_to_uint256(data) AS decimal(38,0)) AS amt
    FROM mantle.logs
    WHERE contract_address = {{token_address}}
      AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
daily AS (
    SELECT date_trunc('day', block_time) AS day,
           SUM(CASE WHEN kind = 'mint' THEN amt ELSE 0 END) AS minted,
           SUM(CASE WHEN kind = 'burn' THEN amt ELSE 0 END) AS burned
    FROM flows
    GROUP BY 1
)
SELECT
    day,
    CAST(SUM(minted)          OVER (ORDER BY day) AS double) / 1e18 AS cum_minted,
    CAST(SUM(burned)          OVER (ORDER BY day) AS double) / 1e18 AS cum_burned,
    CAST(SUM(minted - burned) OVER (ORDER BY day) AS double) / 1e18 AS net_supply
FROM daily
ORDER BY day
