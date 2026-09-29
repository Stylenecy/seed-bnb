/// Per-position agent state and the action log.
///
/// ## No Nautilus
/// The earlier design routed agent decisions through Nautilus verifiable compute.
/// That is removed entirely. Trust now rests on two things only:
///   1. An `AgentCap` (see `equinox::access`) gates who may submit actions.
///   2. Every action is committed to an on-chain **hash chain** (`log_head`);
///      the full decision payload is stored off-chain (Walrus) and referenced by
///      its hash, giving tamper-evident auditability without verifiable compute.
///
/// The agent can never move funds outside what the vault's Move invariants allow
/// — the cap only authorizes *which* in-bounds actions run, not arbitrary access.
module equinox::agent;

use std::bcs;
use std::string::String;
use sui::clock::Clock;
use sui::coin;
use sui::hash;
use equinox::vault::{Self, Vault};
use equinox::access::AgentCap;
use equinox::registry::{Self, Registry};
use equinox::native_pool::{Self, NativePool};
use equinox::oracle::{Self, PriceCache};
use equinox::math;

// Modes — what to do with captured spread / how to size positions.
const MODE_FOREVER_INCOME: u8 = 0;
const MODE_LOAN_AUTOREPAY: u8 = 1;
const MODE_YIELD_MAX: u8 = 2;

// Risk profiles.
const RISK_CONSERVATIVE: u8 = 0;
const RISK_BALANCED: u8 = 1;
const RISK_AGGRESSIVE: u8 = 2;

const ENotOwner: u64 = 1;
const EBadParams: u64 = 2;
const EWrongVault: u64 = 3;

public struct AgentState has key {
    id: UID,
    vault_id: ID,
    owner: address,
    mode: u8,
    /// Strategy template: 0 conservative, 1 balanced, 2 aggressive. (Same scale as
    /// the risk profile.) Drives the params below via `apply_template`.
    risk: u8,
    /// Target LTV the agent borrows to, in bps.
    target_ltv_bps: u64,
    /// Share of borrowed principal deployed to the lend venue for yield, in bps.
    /// The remainder stays in the reserve fund (`vault.buffer`).
    recycle_ratio_bps: u64,
    /// Minimum health factor (bps) the defense system enforces.
    min_hf_bps: u64,
    /// User's chosen DeFi venue to BORROW from (registry venue name; empty = native).
    borrow_venue: String,
    /// User's chosen DeFi venue to LEND the borrowed proceeds to (yield).
    lend_venue: String,
    last_action_ms: u64,
    action_count: u64,
    /// Hash-chain head over all recorded actions. Full logs live on Walrus.
    log_head: vector<u8>,
}

/// Create agent state for a vault the caller owns. Composable.
public fun new<C, Q>(
    vault: &Vault<C, Q>,
    mode: u8,
    risk: u8,
    target_ltv_bps: u64,
    recycle_ratio_bps: u64,
    min_hf_bps: u64,
    ctx: &mut TxContext,
): AgentState {
    assert!(vault::owner(vault) == ctx.sender(), ENotOwner);
    assert!(mode <= MODE_YIELD_MAX && risk <= RISK_AGGRESSIVE, EBadParams);
    assert!(target_ltv_bps <= 10_000 && recycle_ratio_bps <= 10_000, EBadParams);
    AgentState {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        mode,
        risk,
        target_ltv_bps,
        recycle_ratio_bps,
        min_hf_bps,
        borrow_venue: b"".to_string(),
        lend_venue: b"".to_string(),
        last_action_ms: 0,
        action_count: 0,
        log_head: vector[],
    }
}

/// Open + share agent state for a vault you own.
entry fun open_agent<C, Q>(
    vault: &Vault<C, Q>,
    mode: u8,
    risk: u8,
    target_ltv_bps: u64,
    recycle_ratio_bps: u64,
    min_hf_bps: u64,
    ctx: &mut TxContext,
) {
    let state = new(vault, mode, risk, target_ltv_bps, recycle_ratio_bps, min_hf_bps, ctx);
    transfer::share_object(state);
}

// === Owner config ===

public fun set_mode(state: &mut AgentState, mode: u8, ctx: &TxContext) {
    assert_owner(state, ctx);
    assert!(mode <= MODE_YIELD_MAX, EBadParams);
    state.mode = mode;
}

public fun set_risk(state: &mut AgentState, risk: u8, ctx: &TxContext) {
    assert_owner(state, ctx);
    assert!(risk <= RISK_AGGRESSIVE, EBadParams);
    state.risk = risk;
}

public fun set_targets(
    state: &mut AgentState,
    target_ltv_bps: u64,
    recycle_ratio_bps: u64,
    min_hf_bps: u64,
    ctx: &TxContext,
) {
    assert_owner(state, ctx);
    assert!(target_ltv_bps <= 10_000 && recycle_ratio_bps <= 10_000, EBadParams);
    state.target_ltv_bps = target_ltv_bps;
    state.recycle_ratio_bps = recycle_ratio_bps;
    state.min_hf_bps = min_hf_bps;
}

/// Apply one of the three strategy templates. Sets `risk` + the derived params:
/// target LTV (how much to borrow), recycle ratio (share of proceeds to the lend
/// venue for yield; the rest stays in the reserve fund), and the defense line.
/// Owner-gated — this is the "user picks conservative/balanced/aggressive" action.
public fun apply_template(state: &mut AgentState, template: u8, ctx: &TxContext) {
    assert_owner(state, ctx);
    assert!(template <= RISK_AGGRESSIVE, EBadParams);
    state.risk = template;
    if (template == RISK_CONSERVATIVE) {
        state.target_ltv_bps = 4_000;  // borrow up to 40% LTV
        state.recycle_ratio_bps = 5_000;  // 50% to yield, 50% reserve
        state.min_hf_bps = 15_000;     // defend at 1.5x
    } else if (template == RISK_BALANCED) {
        state.target_ltv_bps = 5_500;
        state.recycle_ratio_bps = 7_000;
        state.min_hf_bps = 13_000;
    } else {
        state.target_ltv_bps = 6_500;
        state.recycle_ratio_bps = 8_500;
        state.min_hf_bps = 11_500;
    };
}

/// Set the user's chosen borrow + lend venues (validated as enabled in the
/// registry). Empty borrow venue means the native pool. Owner-gated.
public fun set_venues(
    state: &mut AgentState,
    reg: &Registry,
    borrow_venue: String,
    lend_venue: String,
    ctx: &TxContext,
) {
    assert_owner(state, ctx);
    reg.assert_venue_enabled(borrow_venue);
    reg.assert_venue_enabled(lend_venue);
    state.borrow_venue = borrow_venue;
    state.lend_venue = lend_venue;
}

// === Agent action log ===

/// Commit an agent action to the hash chain. `payload_hash` is the hash of the
/// full decision record stored on Walrus. Agent-gated.
public fun record_action(
    state: &mut AgentState,
    _agent: &AgentCap,
    action_code: u8,
    payload_hash: vector<u8>,
    clock: &Clock,
) {
    let ts = clock.timestamp_ms();
    let mut data = state.log_head;
    data.push_back(action_code);
    data.append(payload_hash);
    data.append(bcs::to_bytes(&ts));
    state.log_head = hash::blake2b256(&data);
    state.last_action_ms = ts;
    state.action_count = state.action_count + 1;
}

// === Skim (the borrow leg) ===

/// Borrow (in the debt asset `Q`) against collateral `C` up to the agent's target
/// LTV — valued in USD via the oracle — and route the proceeds into the vault's
/// **reserve fund** (`vault.buffer`): the pot the agent draws from to defend, the
/// destination of skim proceeds, and the owner's spendable balance. Agent-gated.
/// Returns the Q amount skimmed (0 if there is no headroom or no pool liquidity).
///
/// Bounded by: (target-LTV headroom) ∧ (registry max-LTV headroom) ∧ (pool
/// liquidity). Debt and the pool's `total_borrowed` move in lockstep.
///
/// (The split of the reserve between idle reserve and the lend venue — per the
/// agent's `recycle_ratio_bps` template — is a separate deploy step; see
/// `borrow_venue`/`lend_venue` and the strategy templates.)
public fun skim_to_reserve<C, Q>(
    vault: &mut Vault<C, Q>,
    _agent: &AgentCap,
    reg: &Registry,
    state: &AgentState,
    pool: &mut NativePool<Q>,
    cache: &PriceCache,
    clock: &Clock,
    max_age_ms: u64,
    ctx: &mut TxContext,
): u64 {
    assert!(state.vault_id == object::id(vault), EWrongVault);
    reg.assert_not_paused(); // emergency stop halts new borrows (defend stays open)

    // Value both legs in USD.
    let collateral_usd = oracle::usd_value<C>(
        cache, vault::collateral_value(vault), registry::asset_decimals<C>(reg), clock, max_age_ms,
    );
    let debt_usd = oracle::usd_value<Q>(
        cache, vault::debt(vault), registry::asset_decimals<Q>(reg), clock, max_age_ms,
    );

    // Headroom to target LTV, never beyond the collateral asset's max LTV.
    let cap_usd = math::min(
        math::apply_bps(collateral_usd, state.target_ltv_bps),
        math::apply_bps(collateral_usd, registry::max_ltv_bps<C>(reg)),
    );
    let headroom_usd = if (cap_usd > debt_usd) cap_usd - debt_usd else 0;
    let headroom_q = oracle::amount_from_usd<Q>(
        cache, headroom_usd, registry::asset_decimals<Q>(reg), clock, max_age_ms,
    );
    let amount = math::min(headroom_q, native_pool::reserve_value(pool));
    if (amount == 0) return 0;

    let borrowed = native_pool::borrow<Q>(pool, amount, ctx);
    vault::increase_debt(vault, amount);
    vault::add_buffer(vault, coin::into_balance(borrowed)); // proceeds -> reserve fund
    amount
}

fun assert_owner(state: &AgentState, ctx: &TxContext) {
    assert!(state.owner == ctx.sender(), ENotOwner);
}

// === Views ===

public fun vault_id(s: &AgentState): ID { s.vault_id }
public fun owner(s: &AgentState): address { s.owner }
public fun mode(s: &AgentState): u8 { s.mode }
public fun risk(s: &AgentState): u8 { s.risk }
public fun target_ltv_bps(s: &AgentState): u64 { s.target_ltv_bps }
public fun recycle_ratio_bps(s: &AgentState): u64 { s.recycle_ratio_bps }
public fun min_hf_bps(s: &AgentState): u64 { s.min_hf_bps }
public fun borrow_venue(s: &AgentState): String { s.borrow_venue }
public fun lend_venue(s: &AgentState): String { s.lend_venue }
public fun last_action_ms(s: &AgentState): u64 { s.last_action_ms }
public fun action_count(s: &AgentState): u64 { s.action_count }
public fun log_head(s: &AgentState): vector<u8> { s.log_head }

// === Mode / risk constants ===

public fun mode_forever_income(): u8 { MODE_FOREVER_INCOME }
public fun mode_loan_autorepay(): u8 { MODE_LOAN_AUTOREPAY }
public fun mode_yield_max(): u8 { MODE_YIELD_MAX }
public fun risk_conservative(): u8 { RISK_CONSERVATIVE }
public fun risk_balanced(): u8 { RISK_BALANCED }
public fun risk_aggressive(): u8 { RISK_AGGRESSIVE }
