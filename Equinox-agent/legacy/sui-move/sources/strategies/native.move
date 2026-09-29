/// Native venue — Equinox's own on-chain lending pool. Fully self-contained (no
/// external protocol), so it works end-to-end on day one and is the reference
/// implementation of the strategy convention in `equinox::strategy`.
///
/// Flow (composed in a PTB by the agent/frontend):
/// ```text
///   ENTER:  (coin, ticket) = vault::enter_strategy<T>(...)
///           pos            = native_pool::deposit<T>(pool, coin, ctx)
///                            vault::record_position<T, NativePosition<T>>(
///                                vault, &mut ticket, pos, principal)
///           native_pool::position_value(&pos) gives `principal`
///                            vault::settle<T>(vault, ticket, true)
///
///   EXIT:   (pos, ticket)  = vault::exit_strategy<T, NativePosition<T>>(...)
///           coin           = native_pool::withdraw<T>(pool, pos, ctx)
///                            vault::repay_underlying<T>(vault, &mut ticket, coin)
///                            vault::settle<T>(vault, ticket, false)
/// ```
/// (`native` is a reserved word in Move, hence the module name `native_pool`.)
module equinox::native_pool;

use std::string::String;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use equinox::access::AdminCap;
use equinox::registry::{Self, Registry};

const EInsufficientReserve: u64 = 1;
const EAmountZero: u64 = 2;

/// Shared lending pool for asset `T`. Holds all deposited liquidity. Rewards are
/// injected by the protocol (or the spread engine) via `fund_rewards`, which
/// raises the redeemable value per unit of principal.
public struct NativePool<phantom T> has key {
    id: UID,
    reserve: Balance<T>,
    /// Total principal deposited (excludes injected rewards).
    total_principal: u64,
    /// Liquidity currently lent out (borrowed against vault collateral).
    /// Invariant: `total_principal <= reserve + total_borrowed`.
    total_borrowed: u64,
}

/// A deposit receipt. `key + store` so a vault can custody it via its ObjectBag.
public struct NativePosition<phantom T> has key, store {
    id: UID,
    principal: u64,
}

/// Create and share a native pool for `T`. Admin-gated.
public fun create_pool<T>(_admin: &AdminCap, ctx: &mut TxContext) {
    transfer::share_object(NativePool<T> {
        id: object::new(ctx),
        reserve: balance::zero<T>(),
        total_principal: 0,
        total_borrowed: 0,
    });
}

/// Register this pool as a selectable venue (kind = NATIVE).
public fun register<T>(
    reg: &mut Registry,
    admin: &AdminCap,
    name: String,
    pool: &NativePool<T>,
) {
    registry::register_venue(reg, admin, registry::venue_native(), name, @0x0, option::some(object::id(pool)));
}

/// Deposit `coin` into the pool, returning a position receipt.
public fun deposit<T>(pool: &mut NativePool<T>, coin: Coin<T>, ctx: &mut TxContext): NativePosition<T> {
    let principal = coin.value();
    assert!(principal > 0, EAmountZero);
    pool.reserve.join(coin.into_balance());
    pool.total_principal = pool.total_principal + principal;
    NativePosition<T> { id: object::new(ctx), principal }
}

/// Redeem a position for the underlying. With no rewards injected this returns
/// exactly `principal`; injected rewards are shared pro-rata by principal.
public fun withdraw<T>(pool: &mut NativePool<T>, pos: NativePosition<T>, ctx: &mut TxContext): Coin<T> {
    let NativePosition { id, principal } = pos;
    id.delete();

    // Pro-rata redemption value = principal * reserve / total_principal.
    let payout = if (pool.total_principal == 0) {
        principal
    } else {
        (((principal as u128) * (pool.reserve.value() as u128)) / (pool.total_principal as u128)) as u64
    };
    assert!(pool.reserve.value() >= payout, EInsufficientReserve);
    pool.total_principal = if (principal >= pool.total_principal) 0 else pool.total_principal - principal;
    coin::from_balance(pool.reserve.split(payout), ctx)
}

/// Inject yield into the pool (raises everyone's redemption value). Permissionless
/// top-up — anyone can subsidize the pool (e.g. the spread engine routing profit).
public fun fund_rewards<T>(pool: &mut NativePool<T>, coin: Coin<T>) {
    pool.reserve.join(coin.into_balance());
}

/// Lend `amount` out of the reserve (the borrow leg). Package-internal — only the
/// agent's skim / borrow path calls this, so debt is always recorded in lockstep.
public(package) fun borrow<T>(pool: &mut NativePool<T>, amount: u64, ctx: &mut TxContext): Coin<T> {
    assert!(pool.reserve.value() >= amount, EInsufficientReserve);
    pool.total_borrowed = pool.total_borrowed + amount;
    coin::from_balance(pool.reserve.split(amount), ctx)
}

/// Repay borrowed liquidity back into the reserve. Package-internal — called by
/// the agent (skim unwind) and by `defense` when repaying from the buffer.
public(package) fun repay_loan<T>(pool: &mut NativePool<T>, coin: Coin<T>) {
    let amount = coin.value();
    pool.total_borrowed = if (amount >= pool.total_borrowed) 0 else pool.total_borrowed - amount;
    pool.reserve.join(coin.into_balance());
}

// === Views ===

public fun position_value<T>(pos: &NativePosition<T>): u64 { pos.principal }
public fun reserve_value<T>(pool: &NativePool<T>): u64 { pool.reserve.value() }
public fun total_principal<T>(pool: &NativePool<T>): u64 { pool.total_principal }
public fun total_borrowed<T>(pool: &NativePool<T>): u64 { pool.total_borrowed }

#[test_only]
public fun new_pool_for_testing<T>(ctx: &mut TxContext): NativePool<T> {
    NativePool<T> { id: object::new(ctx), reserve: balance::zero<T>(), total_principal: 0, total_borrowed: 0 }
}

#[test_only]
public fun destroy_pool_for_testing<T>(pool: NativePool<T>) {
    let NativePool { id, reserve, total_principal: _, total_borrowed: _ } = pool;
    reserve.destroy_for_testing();
    id.delete();
}
