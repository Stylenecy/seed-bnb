-- Q12: April-spike distributor identity. Who sent the cohort their first xStocks?
-- Live: https://dune.com/queries/7866312  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Groups the cohort's direct-transfer entries (tx_to = token contract) by sender wallet.
-- Result: top sender 0x5888...836c reached 462 of ~816 cohort wallets, sent 7 xStocks,
-- was active every day of April 13 to May 10 with varied amounts (stddev 14). That is a CEX
-- hot wallet, confirmed as Bybit's Mantle wallet via Bybit Proof-of-Reserves reports.
-- The long tail of smaller senders shows recurring exact medians (for example 10.0772
-- across several wallets), which points to programmatic upstream payouts.
WITH universe AS (
    SELECT contract_address, MAX(symbol) AS symbol
    FROM tokens.erc20
    WHERE blockchain = 'mantle' AND lower(name) LIKE '%xstock%'
    GROUP BY 1
),
xfers AS (
    SELECT l.contract_address, u.symbol,
           bytearray_substring(l.topic1, 13, 20) AS from_addr,
           bytearray_substring(l.topic2, 13, 20) AS to_addr,
           l.block_date, l.tx_to, l.tx_from,
           CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM mantle.logs l
    JOIN universe u ON u.contract_address = l.contract_address
    WHERE l.topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
first_receipt AS (
    SELECT to_addr AS holder, MIN(block_date) AS first_day
    FROM xfers
    WHERE to_addr <> 0x0000000000000000000000000000000000000000
      AND to_addr <> 0x5f7a4c11bde4f218f0025ef444c369d838ffa2ad
    GROUP BY 1
),
spike_cohort AS (
    SELECT holder FROM first_receipt
    WHERE first_day >= date '2026-04-13' AND first_day < date '2026-05-11'
),
entry_transfers AS (
    SELECT x.*
    FROM xfers x
    JOIN spike_cohort c ON c.holder = x.to_addr
    WHERE x.block_date >= date '2026-04-13' AND x.block_date < date '2026-05-11'
      AND x.tx_to = x.contract_address      -- direct token.transfer() calls (dominant pattern)
)
SELECT
    from_addr                                   AS sender,
    tx_from                                     AS tx_initiator,
    CAST(COUNT(DISTINCT symbol) AS bigint)      AS tokens_sent,
    CAST(COUNT(*) AS bigint)                    AS transfers,
    CAST(COUNT(DISTINCT to_addr) AS bigint)     AS unique_recipients,
    MIN(block_date)                             AS first_send,
    MAX(block_date)                             AS last_send,
    CAST(COUNT(DISTINCT block_date) AS bigint)  AS active_days,
    ROUND(approx_percentile(CAST(amt AS double) / 1e18, 0.5), 4) AS median_tokens,
    ROUND(stddev(CAST(amt AS double) / 1e18), 2) AS stddev_tokens
FROM entry_transfers
GROUP BY 1, 2
ORDER BY unique_recipients DESC
LIMIT 25
