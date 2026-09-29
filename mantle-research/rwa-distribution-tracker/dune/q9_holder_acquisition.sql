-- Q9: Holder acquisition. Do xStocks bring new wallets to BNB Chain?
-- Live: TODO re-publish on Dune for BNB Chain (Mantle original: see legacy/mantle)
-- For every wallet currently holding any xStock (exact balance > 0, issuer excluded):
--   first_active  = first day the wallet initiated any tx that emitted a log (bnb.logs.tx_from)
--   first_xstock  = first day it received any xStock
-- Buckets:
--   'existing BNB Chain user'  first_active < first_xstock  (RWA recycled an existing user)
--   'arrived with xStock'   first_active >= first_xstock (wallet showed up for the RWA)
--   'passive receiver'      never initiated a logged tx
--   'contract (pool/vault)' address created by a contract deployment (bnb.creation_traces)
-- Coverage: bnb.logs spans BSC genesis (2020-08-29) to today, so wallet ages are real.
-- Cost note: BSC is a high-volume chain; scanning bnb.logs by tx_from is expensive. Add a date bound if needed.
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
           l.block_date,
           CAST(bytearray_to_uint256(l.data) AS decimal(38,0)) AS amt
    FROM bnb.logs l
    JOIN universe u ON u.contract_address = l.contract_address
    WHERE l.topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
),
balances AS (
    SELECT holder, SUM(amt) AS bal
    FROM (
        SELECT contract_address, from_addr AS holder, -amt AS amt FROM xfers
        UNION ALL
        SELECT contract_address, to_addr AS holder, amt FROM xfers
    )
    WHERE holder <> 0x0000000000000000000000000000000000000000
      AND holder <> {{issuer_wallet}}  -- issuer
    GROUP BY 1
    HAVING SUM(amt) > 0
),
first_xstock AS (
    SELECT to_addr AS holder, MIN(block_date) AS first_xstock_day
    FROM xfers
    GROUP BY 1
),
first_activity AS (
    SELECT l.tx_from AS holder, MIN(l.block_date) AS first_active_day
    FROM bnb.logs l
    JOIN balances b ON b.holder = l.tx_from
    GROUP BY 1
),
contracts AS (
    SELECT ct.address AS holder
    FROM bnb.creation_traces ct
    JOIN balances b ON b.holder = ct.address
    GROUP BY 1
),
classified AS (
    SELECT
        b.holder,
        CASE
            WHEN c.holder IS NOT NULL                      THEN 'contract (pool/vault)'
            WHEN fa.first_active_day IS NULL               THEN 'passive receiver'
            WHEN fa.first_active_day < fx.first_xstock_day THEN 'existing BNB Chain user'
            ELSE 'arrived with xStock'
        END AS bucket,
        date_diff('day', fa.first_active_day, fx.first_xstock_day) AS days_on_bnb_before_xstock
    FROM balances b
    LEFT JOIN first_xstock   fx ON fx.holder = b.holder
    LEFT JOIN first_activity fa ON fa.holder = b.holder
    LEFT JOIN contracts       c ON c.holder = b.holder
)
SELECT
    bucket,
    CAST(COUNT(*) AS bigint) AS wallets,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS share_pct,
    approx_percentile(CASE WHEN bucket = 'existing BNB Chain user'
                           THEN days_on_bnb_before_xstock END, 0.5) AS median_days_before_first_xstock
FROM classified
GROUP BY 1
ORDER BY wallets DESC
