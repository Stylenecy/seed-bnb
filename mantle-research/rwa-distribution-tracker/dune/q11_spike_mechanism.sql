-- Q11: Spike mechanism. How did the cohort that arrived in {{window_start}} to {{window_end}} get their first xStock?
-- Live: TODO re-publish on Dune for BNB Chain (Mantle original: see legacy/mantle)
-- Groups the cohort's entry transfers by token, tx target contract, and token source.
-- Reading: tx_to = TOKEN CONTRACT with self_initiated = 0 (a third party calling token.transfer()
-- straight to the wallet) is the CEX-withdrawal fingerprint; router calls are DEX buys.
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
)
SELECT
    symbol,
    tx_to,
    CASE
        WHEN from_addr = 0x0000000000000000000000000000000000000000 THEN 'mint'
        WHEN from_addr = {{issuer_wallet}} THEN 'issuer wallet'
        ELSE 'other holder/pool'
    END AS src_class,
    CAST(COUNT(*) AS bigint)                    AS transfers,
    CAST(COUNT(DISTINCT to_addr) AS bigint)     AS wallets,
    CAST(COUNT(DISTINCT CASE WHEN tx_from = to_addr THEN to_addr END) AS bigint) AS self_initiated_wallets,
    ROUND(approx_percentile(CAST(amt AS double) / 1e18, 0.5), 4) AS median_tokens,
    ROUND(SUM(CAST(amt AS double)) / 1e18, 1)   AS total_tokens
FROM entry_transfers
GROUP BY 1, 2, 3
ORDER BY wallets DESC
LIMIT 40
