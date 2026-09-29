-- Q12: Spike distributor identity. Who sent the cohort their first xStocks?
-- Live: TODO re-publish on Dune for BNB Chain (Mantle original: see legacy/mantle)
-- Groups the cohort's direct-transfer entries (tx_to = token contract) by sender wallet.
-- Reading: one sender reaching many wallets daily with varied amounts is a CEX hot wallet;
-- confirm identity against exchange Proof-of-Reserves address lists.
-- Params: {{window_start}}, {{window_end}} (YYYY-MM-DD, end exclusive), {{issuer_wallet}}.
WITH universe AS (
    SELECT contract_address, MAX(symbol) AS symbol
    FROM tokens.erc20
    WHERE blockchain = 'bnb' AND lower(name) LIKE '%xstock%'
    GROUP BY 1
),
xfers AS (
    SELECT l.contract_address, u.symbol,
           bytearray_substring(l.topic1, 13, 20) AS from_addr,
           bytearray_substring(l.topic2, 13, 20) AS to_addr,
           l.block_date, l.tx_to, l.tx_from,
           CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM bnb.logs l
    JOIN universe u ON u.contract_address = l.contract_address
    WHERE l.topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
first_receipt AS (
    SELECT to_addr AS holder, MIN(block_date) AS first_day
    FROM xfers
    WHERE to_addr <> 0x0000000000000000000000000000000000000000
      AND to_addr <> {{issuer_wallet}}
    GROUP BY 1
),
spike_cohort AS (
    SELECT holder FROM first_receipt
    WHERE first_day >= date '{{window_start}}' AND first_day < date '{{window_end}}'
),
entry_transfers AS (
    SELECT x.*
    FROM xfers x
    JOIN spike_cohort c ON c.holder = x.to_addr
    WHERE x.block_date >= date '{{window_start}}' AND x.block_date < date '{{window_end}}'
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
