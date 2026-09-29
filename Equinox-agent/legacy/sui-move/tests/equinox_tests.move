#[test_only]
module equinox::equinox_tests;

use std::string::String;
use sui::coin;
use sui::clock;
use sui::test_scenario as ts;
use std::unit_test;
use equinox::access;
use equinox::registry;
use equinox::vault;
use equinox::native_pool::{Self, NativePosition};
use equinox::agent;
use equinox::defense;
use equinox::shadow;
use equinox::oracle;

/// Throwaway coin types: USDC = quote/debt asset, SUIX = volatile collateral.
public struct USDC has drop {}
public struct SUIX has drop {}

const USER: address = @0xB0B;
const MAX_AGE: u64 = 60_000;

fun venue(): String { b"native-usdc".to_string() }

/// Cross-asset world: SUIX collateral @ given price, USDC debt @ $1.
fun setup_prices(
    reg: &mut registry::Registry,
    admin: &access::AdminCap,
    cache: &mut oracle::PriceCache,
    cap: &oracle::OracleCap,
    clk: &clock::Clock,
    suix_price_8dp: u64,
) {
    registry::register_asset<SUIX>(reg, admin, 6_000, 8_000, 9, b"sui-feed");
    registry::register_asset<USDC>(reg, admin, 9_000, 9_500, 6, b"usdc-feed");
    oracle::set_price<SUIX>(cache, cap, suix_price_8dp, clk);
    oracle::set_price<USDC>(cache, cap, 100_000_000, clk); // $1.00
}

#[test]
fun test_vault_deposit_withdraw() {
    let mut sc = ts::begin(USER);
    let mut v = vault::new<USDC, USDC>(USER, sc.ctx());

    vault::deposit(&mut v, coin::mint_for_testing<USDC>(1_000, sc.ctx()));
    assert!(vault::collateral_value(&v) == 1_000, 0);

    let out = vault::withdraw(&mut v, 400, sc.ctx());
    assert!(out.value() == 400, 1);
    assert!(vault::idle_value(&v) == 600, 2);

    coin::burn_for_testing(out);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_native_strategy_roundtrip() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let agent_cap = access::new_agent_cap(&admin, sc.ctx());

    let mut reg = registry::new_for_testing(sc.ctx());
    registry::register_asset<USDC>(&mut reg, &admin, 6_000, 8_000, 6, b"feed");

    let mut pool = native_pool::new_pool_for_testing<USDC>(sc.ctx());
    native_pool::register<USDC>(&mut reg, &admin, venue(), &pool);

    let mut v = vault::new<USDC, USDC>(USER, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<USDC>(1_000, sc.ctx()));

    let (coin_out, mut ticket) =
        vault::enter_strategy<USDC, USDC>(&mut v, &reg, &agent_cap, venue(), 600, 600, sc.ctx());
    let pos = native_pool::deposit<USDC>(&mut pool, coin_out, sc.ctx());
    let realized = native_pool::position_value(&pos);
    vault::record_position<USDC, USDC, NativePosition<USDC>>(&mut v, &mut ticket, pos, realized);
    vault::settle<USDC, USDC>(&v, ticket, true);
    assert!(vault::total_deployed(&v) == 600, 0);

    let (pos2, mut ticket2) =
        vault::exit_strategy<USDC, USDC, NativePosition<USDC>>(&mut v, &reg, &agent_cap, venue(), 600);
    let coin_back = native_pool::withdraw<USDC>(&mut pool, pos2, sc.ctx());
    vault::repay_underlying<USDC, USDC>(&mut v, &mut ticket2, coin_back);
    vault::settle<USDC, USDC>(&v, ticket2, false);
    assert!(vault::total_deployed(&v) == 0, 1);
    assert!(vault::idle_value(&v) == 1_000, 2);

    access::destroy_admin_cap_for_testing(admin);
    access::revoke_agent_cap(agent_cap);
    unit_test::destroy(reg);
    unit_test::destroy(pool);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_cross_asset_health_factor() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let oracle_cap = oracle::new_oracle_cap(&admin, sc.ctx());
    let clk = clock::create_for_testing(sc.ctx());
    let mut reg = registry::new_for_testing(sc.ctx());
    let mut cache = oracle::new_cache_for_testing(sc.ctx());
    setup_prices(&mut reg, &admin, &mut cache, &oracle_cap, &clk, 200_000_000); // $2.00

    let mut v = vault::new<SUIX, USDC>(USER, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<SUIX>(1_000_000_000, sc.ctx())); // 1 SUIX
    vault::increase_debt(&mut v, 1_000_000);                                       // 1 USDC

    assert!(defense::health_factor_priced<SUIX, USDC>(&v, &reg, &cache, &clk, MAX_AGE) == 16_000, 0);
    oracle::set_price<SUIX>(&mut cache, &oracle_cap, 120_000_000, &clk); // -> $1.20
    assert!(defense::health_factor_priced<SUIX, USDC>(&v, &reg, &cache, &clk, MAX_AGE) == 9_600, 1);

    oracle::revoke_oracle_cap(oracle_cap);
    access::destroy_admin_cap_for_testing(admin);
    clock::destroy_for_testing(clk);
    unit_test::destroy(reg);
    unit_test::destroy(cache);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_skim_to_reserve() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let agent_cap = access::new_agent_cap(&admin, sc.ctx());
    let oracle_cap = oracle::new_oracle_cap(&admin, sc.ctx());
    let clk = clock::create_for_testing(sc.ctx());

    let mut reg = registry::new_for_testing(sc.ctx());
    let mut cache = oracle::new_cache_for_testing(sc.ctx());
    setup_prices(&mut reg, &admin, &mut cache, &oracle_cap, &clk, 200_000_000); // SUIX $2

    let mut pool = native_pool::new_pool_for_testing<USDC>(sc.ctx());
    native_pool::fund_rewards<USDC>(&mut pool, coin::mint_for_testing<USDC>(5_000_000, sc.ctx()));

    let mut v = vault::new<SUIX, USDC>(USER, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<SUIX>(1_000_000_000, sc.ctx())); // 1 SUIX = $2
    let state = agent::new<SUIX, USDC>(
        &v, agent::mode_yield_max(), agent::risk_balanced(), 5_000, 4_000, 11_000, sc.ctx(),
    );

    // 50% of $2 = $1 -> borrow 1 USDC into the reserve (buffer).
    let skimmed = agent::skim_to_reserve<SUIX, USDC>(
        &mut v, &agent_cap, &reg, &state, &mut pool, &cache, &clk, MAX_AGE, sc.ctx(),
    );
    assert!(skimmed == 1_000_000, 0);
    assert!(vault::debt(&v) == 1_000_000, 1);
    assert!(vault::buffer_value(&v) == 1_000_000, 2);        // proceeds in the reserve fund
    assert!(vault::collateral_value(&v) == 1_000_000_000, 3); // collateral untouched
    assert!(native_pool::total_borrowed(&pool) == 1_000_000, 4);

    // No headroom left -> no-op.
    let again = agent::skim_to_reserve<SUIX, USDC>(
        &mut v, &agent_cap, &reg, &state, &mut pool, &cache, &clk, MAX_AGE, sc.ctx(),
    );
    assert!(again == 0, 5);

    unit_test::destroy(state);
    oracle::revoke_oracle_cap(oracle_cap);
    access::destroy_admin_cap_for_testing(admin);
    access::revoke_agent_cap(agent_cap);
    clock::destroy_for_testing(clk);
    unit_test::destroy(reg);
    unit_test::destroy(cache);
    unit_test::destroy(pool);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_skim_against_deployed_collateral() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let agent_cap = access::new_agent_cap(&admin, sc.ctx());
    let oracle_cap = oracle::new_oracle_cap(&admin, sc.ctx());
    let clk = clock::create_for_testing(sc.ctx());

    let mut reg = registry::new_for_testing(sc.ctx());
    let mut cache = oracle::new_cache_for_testing(sc.ctx());
    setup_prices(&mut reg, &admin, &mut cache, &oracle_cap, &clk, 200_000_000); // SUIX $2

    let mut yield_pool = native_pool::new_pool_for_testing<SUIX>(sc.ctx());
    native_pool::register<SUIX>(&mut reg, &admin, venue(), &yield_pool);
    let mut lender = native_pool::new_pool_for_testing<USDC>(sc.ctx());
    native_pool::fund_rewards<USDC>(&mut lender, coin::mint_for_testing<USDC>(5_000_000, sc.ctx()));

    let mut v = vault::new<SUIX, USDC>(USER, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<SUIX>(1_000_000_000, sc.ctx())); // 1 SUIX

    // Deploy 0.6 SUIX to a yield venue: idle 0.4 + deployed 0.6 = 1 SUIX still.
    let (coin_out, mut ticket) =
        vault::enter_strategy<SUIX, USDC>(&mut v, &reg, &agent_cap, venue(), 600_000_000, 600_000_000, sc.ctx());
    let pos = native_pool::deposit<SUIX>(&mut yield_pool, coin_out, sc.ctx());
    let realized = native_pool::position_value(&pos);
    vault::record_position<SUIX, USDC, NativePosition<SUIX>>(&mut v, &mut ticket, pos, realized);
    vault::settle<SUIX, USDC>(&v, ticket, true);
    assert!(vault::collateral_value(&v) == 1_000_000_000, 0); // full 1 SUIX still counts

    let state = agent::new<SUIX, USDC>(
        &v, agent::mode_yield_max(), agent::risk_balanced(), 5_000, 4_000, 11_000, sc.ctx(),
    );
    let skimmed = agent::skim_to_reserve<SUIX, USDC>(
        &mut v, &agent_cap, &reg, &state, &mut lender, &cache, &clk, MAX_AGE, sc.ctx(),
    );
    assert!(skimmed == 1_000_000, 1);
    assert!(vault::buffer_value(&v) == 1_000_000, 2);

    unit_test::destroy(state);
    oracle::revoke_oracle_cap(oracle_cap);
    access::destroy_admin_cap_for_testing(admin);
    access::revoke_agent_cap(agent_cap);
    clock::destroy_for_testing(clk);
    unit_test::destroy(reg);
    unit_test::destroy(cache);
    unit_test::destroy(yield_pool);
    unit_test::destroy(lender);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_defense_repays_from_reserve() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let oracle_cap = oracle::new_oracle_cap(&admin, sc.ctx());
    let clk = clock::create_for_testing(sc.ctx());

    let mut reg = registry::new_for_testing(sc.ctx());
    let mut cache = oracle::new_cache_for_testing(sc.ctx());
    setup_prices(&mut reg, &admin, &mut cache, &oracle_cap, &clk, 200_000_000); // SUIX $2
    let mut pool = native_pool::new_pool_for_testing<USDC>(sc.ctx());

    let mut v = vault::new<SUIX, USDC>(USER, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<SUIX>(1_000_000_000, sc.ctx())); // 1 SUIX
    vault::fund_buffer(&mut v, coin::mint_for_testing<USDC>(500_000, sc.ctx()));    // 0.5 USDC reserve
    vault::increase_debt(&mut v, 1_000_000);                                        // 1 USDC debt
    let state = agent::new<SUIX, USDC>(
        &v, agent::mode_forever_income(), agent::risk_balanced(), 5_500, 4_000, 11_000, sc.ctx(),
    );

    // Healthy at $2 (HF 1.6x): no-op.
    defense::defend<SUIX, USDC>(&mut v, &reg, &state, &mut pool, &cache, &clk, MAX_AGE, sc.ctx());
    assert!(vault::debt(&v) == 1_000_000, 0);

    // SUIX -> $1.20: HF 0.96x. Defend repays from the reserve.
    oracle::set_price<SUIX>(&mut cache, &oracle_cap, 120_000_000, &clk);
    defense::defend<SUIX, USDC>(&mut v, &reg, &state, &mut pool, &cache, &clk, MAX_AGE, sc.ctx());

    assert!(vault::debt(&v) == 872_727, 1);
    assert!(vault::buffer_value(&v) == 372_727, 2);
    assert!(defense::health_factor_priced<SUIX, USDC>(&v, &reg, &cache, &clk, MAX_AGE) >= 11_000, 3);

    unit_test::destroy(state);
    oracle::revoke_oracle_cap(oracle_cap);
    access::destroy_admin_cap_for_testing(admin);
    clock::destroy_for_testing(clk);
    unit_test::destroy(reg);
    unit_test::destroy(cache);
    unit_test::destroy(pool);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_apply_template_and_withdraw_reserve() {
    let mut sc = ts::begin(USER);
    let mut v = vault::new<SUIX, USDC>(USER, sc.ctx());
    let mut state = agent::new<SUIX, USDC>(
        &v, agent::mode_forever_income(), agent::risk_balanced(), 5_000, 4_000, 11_000, sc.ctx(),
    );

    // Conservative template sets the derived params.
    agent::apply_template(&mut state, agent::risk_conservative(), sc.ctx());
    assert!(agent::risk(&state) == 0, 0);
    assert!(agent::target_ltv_bps(&state) == 4_000, 1);
    assert!(agent::recycle_ratio_bps(&state) == 5_000, 2);
    assert!(agent::min_hf_bps(&state) == 15_000, 3);

    // Owner withdraws spendable from the reserve fund.
    vault::fund_buffer(&mut v, coin::mint_for_testing<USDC>(1_000_000, sc.ctx()));
    let out = vault::withdraw_reserve(&mut v, 400_000, sc.ctx());
    assert!(out.value() == 400_000, 4);
    assert!(vault::buffer_value(&v) == 600_000, 5);

    coin::burn_for_testing(out);
    unit_test::destroy(state);
    unit_test::destroy(v);
    sc.end();
}

#[test]
fun test_shadow_credit_withdraw() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let agent_cap = access::new_agent_cap(&admin, sc.ctx());

    let mut pool = shadow::new_pool_for_testing<USDC>(sc.ctx());
    shadow::credit<USDC>(&mut pool, &agent_cap, USER, coin::mint_for_testing<USDC>(300, sc.ctx()));
    assert!(shadow::balance_of(&pool, USER) == 300, 0);

    let out = shadow::withdraw<USDC>(&mut pool, 100, sc.ctx());
    assert!(out.value() == 100, 1);
    assert!(shadow::balance_of(&pool, USER) == 200, 2);

    coin::burn_for_testing(out);
    access::destroy_admin_cap_for_testing(admin);
    access::revoke_agent_cap(agent_cap);
    unit_test::destroy(pool);
    sc.end();
}

#[test]
#[expected_failure]
fun test_oracle_price_stale() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let oracle_cap = oracle::new_oracle_cap(&admin, sc.ctx());
    let mut clk = clock::create_for_testing(sc.ctx());
    let mut cache = oracle::new_cache_for_testing(sc.ctx());

    oracle::set_price<USDC>(&mut cache, &oracle_cap, 100_000_000, &clk);
    clock::increment_for_testing(&mut clk, 120_000);
    let _p = oracle::price_of<USDC>(&cache, &clk, 60_000); // 60s < 120s -> abort

    oracle::revoke_oracle_cap(oracle_cap);
    access::destroy_admin_cap_for_testing(admin);
    clock::destroy_for_testing(clk);
    unit_test::destroy(cache);
    sc.end();
}

#[test]
#[expected_failure]
fun test_skim_blocked_when_paused() {
    let mut sc = ts::begin(USER);
    let admin = access::new_admin_cap_for_testing(sc.ctx());
    let agent_cap = access::new_agent_cap(&admin, sc.ctx());
    let oracle_cap = oracle::new_oracle_cap(&admin, sc.ctx());
    let clk = clock::create_for_testing(sc.ctx());

    let mut reg = registry::new_for_testing(sc.ctx());
    let mut cache = oracle::new_cache_for_testing(sc.ctx());
    setup_prices(&mut reg, &admin, &mut cache, &oracle_cap, &clk, 200_000_000);
    registry::set_paused(&mut reg, &admin, true); // emergency stop

    let mut pool = native_pool::new_pool_for_testing<USDC>(sc.ctx());
    native_pool::fund_rewards<USDC>(&mut pool, coin::mint_for_testing<USDC>(5_000_000, sc.ctx()));
    let mut v = vault::new<SUIX, USDC>(USER, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<SUIX>(1_000_000_000, sc.ctx()));
    let state = agent::new<SUIX, USDC>(
        &v, agent::mode_yield_max(), agent::risk_balanced(), 5_000, 4_000, 11_000, sc.ctx(),
    );

    let _ = agent::skim_to_reserve<SUIX, USDC>(
        &mut v, &agent_cap, &reg, &state, &mut pool, &cache, &clk, MAX_AGE, sc.ctx(),
    ); // aborts: paused

    unit_test::destroy(state);
    oracle::revoke_oracle_cap(oracle_cap);
    access::destroy_admin_cap_for_testing(admin);
    access::revoke_agent_cap(agent_cap);
    clock::destroy_for_testing(clk);
    unit_test::destroy(reg);
    unit_test::destroy(cache);
    unit_test::destroy(pool);
    unit_test::destroy(v);
    sc.end();
}

#[test]
#[expected_failure]
fun test_withdraw_rejects_non_owner() {
    let mut sc = ts::begin(USER);
    let mut v = vault::new<USDC, USDC>(@0xCAFE, sc.ctx());
    vault::deposit(&mut v, coin::mint_for_testing<USDC>(100, sc.ctx()));
    let out = vault::withdraw(&mut v, 10, sc.ctx()); // USER != owner -> abort
    coin::burn_for_testing(out);
    unit_test::destroy(v);
    sc.end();
}
