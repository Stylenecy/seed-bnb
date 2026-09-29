-- Q8: xStock ecosystem summary. Adoption-gap headline counters.
-- Live: https://dune.com/queries/7863679  (dashboard: https://dune.com/yeheskiel/mantle-rwa-distribution-tracker)
-- Reads Q5's latest result via a cross-query reference (query_7863671) so the counters always
-- match the league table. Dashboard widgets: counters (issued / >=10 holders / distributed).
-- NOTE: if you fork Q5, change the query id below to your fork's id.
SELECT
    CAST(COUNT(*) AS bigint)                                                        AS xstocks_issued,
    CAST(COUNT(*) FILTER (WHERE holders >= 1)  AS bigint)                           AS with_any_holder,
    CAST(COUNT(*) FILTER (WHERE holders >= 10) AS bigint)                           AS with_10plus_holders,
    CAST(COUNT(*) FILTER (WHERE verdict = 'DISTRIBUTED') AS bigint)                 AS distributed_count,
    ROUND(100.0 * CAST(COUNT(*) FILTER (WHERE holders >= 10) AS double) / COUNT(*), 1)          AS pct_10plus_holders,
    ROUND(100.0 * CAST(COUNT(*) FILTER (WHERE verdict = 'DISTRIBUTED') AS double) / COUNT(*), 2) AS pct_distributed
FROM query_7863671
