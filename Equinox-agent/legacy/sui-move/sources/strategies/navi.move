/// Navi adapter — registers Navi lending pools as selectable Equinox venues.
///
/// ## Integration caveat (important)
/// Navi is **account/storage-based**: a deposit is credited to the *transaction
/// sender's* on-chain account inside Navi's `Storage`, and does NOT return a
/// position object that the vault could custody in its `ObjectBag`. That breaks
/// the "store the position object in the shared vault" model that Scallop/native
/// use, because the funds would be tracked under the agent's address rather than
/// the vault.
///
/// Two ways to integrate trustlessly (pick when wiring for real):
///   1. **Per-vault sub-account object**: have the vault own a Navi account-cap
///      object; deposits/withdrawals route through that cap so the position is
///      bound to the vault, not the agent. Store the account-cap via
///      `vault::record_position`. (Preferred.)
///   2. **Receipt-token pools**: if a given Navi pool issues a transferable
///      receipt/LP object, treat it exactly like the Scallop recipe.
///
/// Until one of those is wired, registering a Navi venue makes it *selectable and
/// visible*, and the PTB recipe below documents the call shape. The generic vault
/// hooks (`enter_strategy` / `record_position` / `exit_strategy`) are unchanged —
/// only the object you custody differs (an account-cap instead of a coin).
///
/// ## Mainnet coordinates (Navi is MAINNET-ONLY — see ../../INTEGRATIONS.md)
/// ```text
///   lending pkg  0x1e4a13a0494d5facdbe8473e74127b838c2d446ecec0ce262e2eddafa77259cb
///   oracle obj   0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef
///   storage / Pool<T> / IncentiveV2 / Incentive(v3): per-asset (Navi /api/navi/pools)
///   asset: u8  = Navi's numeric asset id for the coin type
///
///   // use the *_with_account_cap_v2 (non-entry) variants — they return Balance<T>
///   // so the value is composable; the plain entry_* fns auto-transfer to sender.
///   withdraw: <pkg>::lending::withdraw_with_account_cap_v2<T>(clock, oracle, storage,
///       pool, asset, amount, incentive_v2, incentive_v3, account_cap, system_state, ctx)
///       : Balance<T>
///   deposit : <pkg>::lending::entry_deposit<T>(clock, storage, pool, asset, coin,
///       amount, incentive_v2, incentive_v3, ctx)
/// ```
///
/// ## PTB recipe (enter, sub-account variant)
/// ```text
///   (coin, ticket) = equinox::vault::enter_strategy<C,Q>(vault, reg, agentCap,
///                        "navi-sui", amount, min_return, ctx)
///   // deposit `coin` to Navi under a vault-owned AccountCap (the position handle)
///   <pkg>::lending::entry_deposit<C>(clock, storage, pool, asset, coin, amount, inc2, inc3, ctx)
///   equinox::vault::record_position<C, Q, AccountCap>(vault, &mut ticket, account_cap, amount)
///   equinox::vault::settle<C,Q>(vault, ticket, true)
/// ```
/// Exit mirrors it: `exit_strategy` returns the AccountCap, withdraw via
/// `withdraw_with_account_cap_v2` → `Balance<C>` → coin → `repay_underlying`.
/// The vault custodies the **AccountCap** (`key + store`) as the position.
module equinox::navi;

use std::string::String;
use equinox::access::AdminCap;
use equinox::registry::{Self, Registry};

/// Register a Navi pool as a venue named e.g. "navi-sui".
/// `package` = Navi's published package address; `pool` = its shared pool object id.
public fun register_pool(
    reg: &mut Registry,
    admin: &AdminCap,
    name: String,
    package: address,
    pool: ID,
) {
    registry::register_venue(
        reg,
        admin,
        registry::venue_navi(),
        name,
        package,
        option::some(pool),
    );
}
