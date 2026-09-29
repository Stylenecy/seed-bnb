/// Shadow wallet — where the agent routes a user's spendable yield. A shared
/// pool per asset holds the backing liquidity and a per-user balance ledger.
/// Credits are agent-gated (the agent routes captured spread / payouts here);
/// withdrawals are user-gated (only the owner of a balance can pull it).
module equinox::shadow;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};
use equinox::access::{AdminCap, AgentCap};
use equinox::events;

const EInsufficient: u64 = 1;
const EAmountZero: u64 = 2;

public struct ShadowPool<phantom T> has key {
    id: UID,
    reserve: Balance<T>,
    /// Per-user spendable balance (address -> amount).
    balances: Table<address, u64>,
}

/// Create + share a shadow pool for asset `T`. Admin-gated.
public fun create_pool<T>(_admin: &AdminCap, ctx: &mut TxContext) {
    transfer::share_object(ShadowPool<T> {
        id: object::new(ctx),
        reserve: balance::zero<T>(),
        balances: table::new<address, u64>(ctx),
    });
}

/// Agent credits `user`'s shadow balance, backed by `coin`. Agent-gated.
public fun credit<T>(pool: &mut ShadowPool<T>, _agent: &AgentCap, user: address, coin: Coin<T>) {
    let amount = coin.value();
    assert!(amount > 0, EAmountZero);
    pool.reserve.join(coin.into_balance());
    if (pool.balances.contains(user)) {
        let b = pool.balances.borrow_mut(user);
        *b = *b + amount;
    } else {
        pool.balances.add(user, amount);
    };
    events::shadow_credited(user, amount);
}

/// Owner withdraws their shadow balance. Returns the coin (composable).
public fun withdraw<T>(pool: &mut ShadowPool<T>, amount: u64, ctx: &mut TxContext): Coin<T> {
    assert!(amount > 0, EAmountZero);
    let user = ctx.sender();
    assert!(pool.balances.contains(user), EInsufficient);
    let b = pool.balances.borrow_mut(user);
    assert!(*b >= amount, EInsufficient);
    *b = *b - amount;
    events::shadow_withdrawn(user, amount);
    coin::from_balance(pool.reserve.split(amount), ctx)
}

entry fun withdraw_to_sender<T>(pool: &mut ShadowPool<T>, amount: u64, ctx: &mut TxContext) {
    let out = withdraw(pool, amount, ctx);
    transfer::public_transfer(out, ctx.sender());
}

/// Debit `user`'s spendable balance for protocol-internal use. Package-internal:
/// used only by `defense` to spend a user's spendable on their own debt when the
/// buffer is short (saving the position from liquidation). Caps at the available
/// balance and returns the coin (zero coin if the user has none).
public(package) fun debit_internal<T>(
    pool: &mut ShadowPool<T>,
    user: address,
    amount: u64,
    ctx: &mut TxContext,
): Coin<T> {
    if (!pool.balances.contains(user)) return coin::zero<T>(ctx);
    let b = pool.balances.borrow_mut(user);
    let take = if (amount > *b) *b else amount;
    *b = *b - take;
    if (take > 0) events::shadow_withdrawn(user, take);
    coin::from_balance(pool.reserve.split(take), ctx)
}

// === Views ===

public fun balance_of<T>(pool: &ShadowPool<T>, user: address): u64 {
    if (pool.balances.contains(user)) *pool.balances.borrow(user) else 0
}

public fun reserve_value<T>(pool: &ShadowPool<T>): u64 { pool.reserve.value() }

#[test_only]
public fun new_pool_for_testing<T>(ctx: &mut TxContext): ShadowPool<T> {
    ShadowPool<T> {
        id: object::new(ctx),
        reserve: balance::zero<T>(),
        balances: table::new<address, u64>(ctx),
    }
}
