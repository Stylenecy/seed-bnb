-- Q4: Daily transfer activity for one RWA token on Mantle
-- Live: https://dune.com/queries/7863657  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Dashboard widget: column chart (transfers + active receivers per day)
-- Param: {{token_address}}
SELECT
    date_trunc('day', block_time)                                                AS day,
    CAST(COUNT(*) AS bigint)                                                      AS transfers,
    CAST(COUNT(DISTINCT bytearray_substring(topic1, 13, 20)) AS bigint)          AS unique_senders,
    CAST(COUNT(DISTINCT bytearray_substring(topic2, 13, 20)) AS bigint)          AS unique_receivers,
    CAST(SUM(CAST(bytearray_to_uint256(data) AS decimal(38,0))) AS double) / 1e18 AS volume_tokens
FROM mantle.logs
WHERE contract_address = {{token_address}}
  AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
GROUP BY 1
ORDER BY 1
