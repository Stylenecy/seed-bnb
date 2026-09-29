/// On-chain auto-defense. Small and pure on purpose (audit-friendly): it reads
/// the position's health factor and, if unsafe, draws the vault's buffer to repay
/// debt back down to the configured minimum HF.
///
/// `defend` is **permissionless** — anyone (a keeper, the agent, or a watcher)
/// can poke a vault. It can only ever *improve* a position's safety, so there is
/// no harm in letting anyone call it.
///
/// NOTE (MVP scope): debt is modeled as a counter and repayments route back into
/// the native pool as the canonical lender. External-venue debt would route to
/// that venue instead; that wiring is per-adapter and out of MVP scope.
module equinox::defense;

use sui::clock::Clock;
use equinox::vault::{Self, Vault};
use equinox::registry::{Self, Registry};
use equinox::agent::{Self, AgentState};
use equinox::native_pool::{Self, NativePool};
use equinox::oracle::{Self, PriceCache};
use equinox::math;
use equinox::events;

const EWrongVault: u64 = 1;

/// Enforce the position's minimum health factor (cross-asset, USD-priced). If HF
/// is below the agent's `min_hf_bps`, repay just enough debt (asset `Q`) from the
/// buffer to restore it (capped by available buffer and outstanding debt). The
/// drawn liquidity is returned to the lender pool. Permissionless.
public fun defend<C, Q>(
    vault: &mut Vault<C, Q>,
    reg: &Registry,
    state: &AgentState,
    pool: &mut NativePool<Q>,
    cache: &PriceCache,
    clock: &Clock,
    max_age_ms: u64,
    ctx: &mut TxContext,
) {
    assert!(agent::vault_id(state) == object::id(vault), EWrongVault);

    let lt = registry::liq_threshold_bps<C>(reg);
    let collateral_usd = oracle::usd_value<C>(
        cache, vault::collateral_value(vault), registry::asset_decimals<C>(reg), clock, max_age_ms,
    );
    let debt_usd = oracle::usd_value<Q>(
        cache, vault::debt(vault), registry::asset_decimals<Q>(reg), clock, max_age_ms,
    );
    let hf = math::health_factor_bps(collateral_usd, lt, debt_usd);
    let min_hf = agent::min_hf_bps(state);

    if (hf >= min_hf) {
        events::defense_triggered(object::id(vault), hf, 0);
        return
    };

    // Debt (USD) that restores HF: target = collateral_usd*lt/min_hf. Round the
    // repay UP by one unit so integer flooring never leaves HF a hair below the
    // line (defend should never under-repay).
    let target_debt_usd = math::mul_div(collateral_usd, lt, min_hf);
    let repay_usd = if (debt_usd > target_debt_usd) debt_usd - target_debt_usd else 0;
    let want = math::min(
        oracle::amount_from_usd<Q>(cache, repay_usd, registry::asset_decimals<Q>(reg), clock, max_age_ms) + 1,
        vault::debt(vault),
    );

    // Repay from the reserve fund (buffer), capped by available reserve.
    let repay = math::min(want, vault::buffer_value(vault));
    if (repay > 0) {
        native_pool::repay_loan(pool, vault::draw_buffer(vault, repay, ctx)); // back to the lender
        vault::decrease_debt(vault, repay);
    };

    let hf_after = health_factor_priced<C, Q>(vault, reg, cache, clock, max_age_ms);
    events::defense_triggered(object::id(vault), hf_after, repay);
}

/// Cross-asset health factor: collateral in coin `C` (the vault's asset), debt
/// denominated in coin `Q`. Both legs are valued in USD via the Pyth-sourced
/// oracle, so a price move in `C` moves the HF. `max_age_ms` bounds price
/// staleness. Returns HF in bps. This is the read the keeper uses to decide when
/// a position is approaching its defense line.
public fun health_factor_priced<C, Q>(
    vault: &Vault<C, Q>,
    reg: &Registry,
    cache: &PriceCache,
    clock: &Clock,
    max_age_ms: u64,
): u64 {
    let collateral_usd = oracle::usd_value<C>(
        cache, vault::collateral_value(vault), registry::asset_decimals<C>(reg), clock, max_age_ms,
    );
    let debt_usd = oracle::usd_value<Q>(
        cache, vault::debt(vault), registry::asset_decimals<Q>(reg), clock, max_age_ms,
    );
    math::health_factor_bps(collateral_usd, registry::liq_threshold_bps<C>(reg), debt_usd)
}
