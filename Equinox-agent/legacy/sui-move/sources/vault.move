/// The user position object — now cross-asset.
///
/// A `Vault<C, Q>` has **collateral in asset `C`** and **debt denominated in
/// asset `Q`** (the borrow/quote asset, typically a stablecoin). This is what
/// makes the product real: a price move in `C` changes the health factor because
/// collateral and debt are different assets (see `defense::health_factor_priced`).
///
/// It is a SHARED object so the off-chain agent (holding an `AgentCap`) can act
/// autonomously, while withdrawals stay gated to the `owner`.
///
/// Balances held:
/// - `collateral: Balance<C>` — idle collateral (the rest is deployed to venues).
/// - `buffer: Balance<Q>` — defense reserve, in the debt asset, used to repay.
/// - `debt: u64` — outstanding borrow, in `Q` units.
/// External venue positions are custodied opaquely in `positions` (see
/// `equinox::strategy`), so the core needs no dependency on those protocols.
module equinox::vault;

use std::string::String;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::object_bag::{Self, ObjectBag};
use sui::vec_map::{Self, VecMap};
use equinox::access::AgentCap;
use equinox::registry::{Self, Registry};
use equinox::strategy::{Self, StrategyTicket};
use equinox::events;

const ENotOwner: u64 = 1;
const EInsufficientIdle: u64 = 2;
const EAmountZero: u64 = 3;
const EVenueOccupied: u64 = 4;
const EPositionMissing: u64 = 5;

/// `has key` only (no `store`): the vault is never `public_transfer`'d, keeping
/// custody rules inside this module.
public struct Vault<phantom C, phantom Q> has key {
    id: UID,
    owner: address,
    /// Idle collateral (asset C) not deployed to any venue.
    collateral: Balance<C>,
    /// Defense reserve in the debt asset (Q), used to repay under stress.
    buffer: Balance<Q>,
    /// Outstanding debt principal, in Q units.
    debt: u64,
    /// Collateral value deployed per venue (venue name -> C amount).
    deployed: VecMap<String, u64>,
    /// Sum of `deployed`, maintained incrementally (C units).
    total_deployed: u64,
    /// Opaque external venue position objects, keyed by venue name.
    positions: ObjectBag,
}

// === Creation ===

public fun new<C, Q>(owner: address, ctx: &mut TxContext): Vault<C, Q> {
    Vault<C, Q> {
        id: object::new(ctx),
        owner,
        collateral: balance::zero<C>(),
        buffer: balance::zero<Q>(),
        debt: 0,
        deployed: vec_map::empty(),
        total_deployed: 0,
        positions: object_bag::new(ctx),
    }
}

/// Open and share a vault owned by the caller.
entry fun open_vault<C, Q>(ctx: &mut TxContext) {
    let vault = new<C, Q>(ctx.sender(), ctx);
    events::vault_created<C>(object::id(&vault), vault.owner);
    transfer::share_object(vault);
}

// === Deposits / withdrawals (owner-facing) ===

/// Add collateral (asset C). Permissionless top-up.
public fun deposit<C, Q>(vault: &mut Vault<C, Q>, coin: Coin<C>) {
    assert!(coin.value() > 0, EAmountZero);
    vault.collateral.join(coin.into_balance());
    events::deposited(object::id(vault), vault.collateral.value(), collateral_value(vault));
}

/// Withdraw idle collateral (asset C). Owner only. Returns the coin.
public fun withdraw<C, Q>(vault: &mut Vault<C, Q>, amount: u64, ctx: &mut TxContext): Coin<C> {
    assert_owner(vault, ctx);
    assert!(amount > 0, EAmountZero);
    assert!(vault.collateral.value() >= amount, EInsufficientIdle);
    let out = coin::from_balance(vault.collateral.split(amount), ctx);
    events::withdrawn(object::id(vault), amount, collateral_value(vault));
    out
}

entry fun withdraw_to_sender<C, Q>(vault: &mut Vault<C, Q>, amount: u64, ctx: &mut TxContext) {
    let out = withdraw(vault, amount, ctx);
    transfer::public_transfer(out, ctx.sender());
}

/// Top up the reserve fund / defense buffer with the debt asset (Q). Permissionless.
public fun fund_buffer<C, Q>(vault: &mut Vault<C, Q>, coin: Coin<Q>) {
    vault.buffer.join(coin.into_balance());
}

/// Withdraw spendable from the reserve fund (buffer). Owner only — this is how a
/// user takes out the money the agent has skimmed into the reserve.
public fun withdraw_reserve<C, Q>(vault: &mut Vault<C, Q>, amount: u64, ctx: &mut TxContext): Coin<Q> {
    assert_owner(vault, ctx);
    assert!(amount > 0, EAmountZero);
    assert!(vault.buffer.value() >= amount, EInsufficientIdle);
    coin::from_balance(vault.buffer.split(amount), ctx)
}

entry fun withdraw_reserve_to_sender<C, Q>(vault: &mut Vault<C, Q>, amount: u64, ctx: &mut TxContext) {
    let out = withdraw_reserve(vault, amount, ctx);
    transfer::public_transfer(out, ctx.sender());
}

// === Strategy round-trip: ENTER (idle collateral -> external venue) ===

public fun enter_strategy<C, Q>(
    vault: &mut Vault<C, Q>,
    reg: &Registry,
    _agent: &AgentCap,
    venue: String,
    amount: u64,
    min_return: u64,
    ctx: &mut TxContext,
): (Coin<C>, StrategyTicket) {
    reg.assert_not_paused();
    reg.assert_venue_enabled(venue);
    assert!(amount > 0, EAmountZero);
    assert!(vault.collateral.value() >= amount, EInsufficientIdle);
    assert!(!vault.deployed.contains(&venue), EVenueOccupied);

    let out = coin::from_balance(vault.collateral.split(amount), ctx);
    let ticket = strategy::new_ticket(object::id(vault), venue, amount, min_return);
    (out, ticket)
}

public fun record_position<C, Q, P: key + store>(
    vault: &mut Vault<C, Q>,
    ticket: &mut StrategyTicket,
    position: P,
    realized: u64,
) {
    let venue = strategy::ticket_venue(ticket);
    assert!(!vault.positions.contains(venue), EVenueOccupied);
    vault.positions.add(venue, position);
    vault.deployed.insert(venue, realized);
    vault.total_deployed = vault.total_deployed + realized;
    strategy::mark_filled(ticket, realized);
}

// === Strategy round-trip: EXIT (external venue -> idle collateral) ===

public fun exit_strategy<C, Q, P: key + store>(
    vault: &mut Vault<C, Q>,
    reg: &Registry,
    _agent: &AgentCap,
    venue: String,
    min_return: u64,
): (P, StrategyTicket) {
    reg.assert_not_paused();
    assert!(vault.positions.contains(venue), EPositionMissing);

    let position = object_bag::remove<String, P>(&mut vault.positions, venue);
    let (_, amount) = vault.deployed.remove(&venue);
    vault.total_deployed = vault.total_deployed - amount;
    let ticket = strategy::new_ticket(object::id(vault), venue, amount, min_return);
    (position, ticket)
}

/// Return the collateral recovered from the venue into idle.
public fun repay_underlying<C, Q>(
    vault: &mut Vault<C, Q>,
    ticket: &mut StrategyTicket,
    coin: Coin<C>,
) {
    let realized = coin.value();
    vault.collateral.join(coin.into_balance());
    strategy::mark_filled(ticket, realized);
}

/// Destroy the ticket, enforcing fill + slippage, and emit. `entered` selects
/// the event flavor (true = enter, false = exit).
public fun settle<C, Q>(vault: &Vault<C, Q>, ticket: StrategyTicket, entered: bool) {
    let (venue, amount_out, realized) = strategy::resolve(ticket, object::id(vault));
    if (entered) {
        events::strategy_entered(object::id(vault), venue, amount_out);
    } else {
        events::strategy_exited(object::id(vault), venue, realized);
    }
}

// === Package-internal accounting hooks (used by agent / defense) ===

public(package) fun add_idle<C, Q>(vault: &mut Vault<C, Q>, bal: Balance<C>) {
    vault.collateral.join(bal);
}

public(package) fun take_idle<C, Q>(vault: &mut Vault<C, Q>, amount: u64): Balance<C> {
    assert!(vault.collateral.value() >= amount, EInsufficientIdle);
    vault.collateral.split(amount)
}

/// Add to the reserve fund (buffer), in the debt asset Q. Used by the agent to
/// route skim proceeds into the reserve.
public(package) fun add_buffer<C, Q>(vault: &mut Vault<C, Q>, bal: Balance<Q>) {
    vault.buffer.join(bal);
}

public(package) fun increase_debt<C, Q>(vault: &mut Vault<C, Q>, amount: u64) {
    vault.debt = vault.debt + amount;
}

public(package) fun decrease_debt<C, Q>(vault: &mut Vault<C, Q>, amount: u64) {
    vault.debt = if (amount >= vault.debt) 0 else vault.debt - amount;
}

/// Draw from the defense buffer (debt asset Q). Caps at the available buffer.
public(package) fun draw_buffer<C, Q>(vault: &mut Vault<C, Q>, amount: u64, ctx: &mut TxContext): Coin<Q> {
    let take = if (amount > vault.buffer.value()) vault.buffer.value() else amount;
    coin::from_balance(vault.buffer.split(take), ctx)
}

// === Views ===

public fun owner<C, Q>(v: &Vault<C, Q>): address { v.owner }
public fun idle_value<C, Q>(v: &Vault<C, Q>): u64 { v.collateral.value() }
public fun buffer_value<C, Q>(v: &Vault<C, Q>): u64 { v.buffer.value() }
public fun total_deployed<C, Q>(v: &Vault<C, Q>): u64 { v.total_deployed }
public fun debt<C, Q>(v: &Vault<C, Q>): u64 { v.debt }

/// Total collateral value in `C` units: idle + deployed (buffer is in `Q`, so it
/// is NOT part of collateral).
public fun collateral_value<C, Q>(v: &Vault<C, Q>): u64 {
    v.collateral.value() + v.total_deployed
}

public fun assert_owner<C, Q>(v: &Vault<C, Q>, ctx: &TxContext) {
    assert!(v.owner == ctx.sender(), ENotOwner);
}

#[test_only]
public fun new_for_testing<C, Q>(owner: address, ctx: &mut TxContext): Vault<C, Q> {
    new<C, Q>(owner, ctx)
}
