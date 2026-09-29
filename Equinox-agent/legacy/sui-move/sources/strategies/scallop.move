/// Scallop adapter — registers Scallop lending markets as selectable Equinox
/// venues and documents the PTB recipe to deploy/redeem against the REAL Scallop
/// package on Sui.
///
/// ## Why this module is thin
/// Scallop's `mint` returns a `Coin<MarketCoin<T>>` (a yield-bearing coin). Coins
/// are `key + store`, so the generic `vault::record_position` / `exit_strategy`
/// custody them directly — the Equinox core never needs Scallop as a compile-time
/// dependency. The real Scallop call is composed in the PTB alongside the vault
/// hooks.
///
/// ## Mainnet coordinates (Scallop is MAINNET-ONLY — see ../../INTEGRATIONS.md)
/// ```text
///   package  0x578374a1f5182013268bbe9b2b080c5d14cbed1a48f9990c5f8a1c33bf100e69
///   market   0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9
///   version  0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7
///   supply : <pkg>::mint::mint<T>(version, market, Coin<T>, clock) : Coin<MarketCoin<T>>
///   redeem : <pkg>::redeem::redeem<T>(version, market, Coin<MarketCoin<T>>, clock) : Coin<T>
///   borrow : via an Obligation (CDP) object — see source / INTEGRATIONS.md
/// ```
///
/// ## Roles this venue can play
/// 1. **Collateral-yield** — supply collateral `C` for yield (works with the
///    current `enter_strategy<C,Q>` path):
///    ```text
///    (coin, ticket) = vault::enter_strategy<C,Q>(vault, reg, agentCap, "scallop-sui", amt, min, ctx)
///    mkt = <pkg>::mint::mint<C>(version, market, coin, clock, ctx)        // Coin<MarketCoin<C>>
///    vault::record_position<C, Q, Coin<MarketCoin<C>>>(vault, &mut ticket, mkt, mkt.value())
///    vault::settle<C,Q>(vault, ticket, true)         // exit: redeem -> Coin<C> -> repay_underlying
///    ```
/// 2. **Lend venue for borrowed `Q`** — supply reserve `Q` → `Coin<MarketCoin<Q>>`
///    (needs a Q-deploy hook on the vault; design slot reserved, not yet built).
/// 3. **Borrow venue** — open Obligation, add collateral, borrow `Q` (needs an
///    external-borrow hook custodying the Obligation; design slot reserved).
///
/// The vault custodies the returned `Coin<MarketCoin<_>>` / Obligation generically
/// (`P: key + store`) — no compile-time Scallop dependency in the core.
module equinox::scallop;

use std::string::String;
use equinox::access::AdminCap;
use equinox::registry::{Self, Registry};

/// Register a Scallop market as a venue named e.g. "scallop-usdc".
/// `package` = Scallop's published package address; `market` = its shared market
/// object id (both needed by the agent/frontend to build the PTB above).
public fun register_market(
    reg: &mut Registry,
    admin: &AdminCap,
    name: String,
    package: address,
    market: ID,
) {
    registry::register_venue(
        reg,
        admin,
        registry::venue_scallop(),
        name,
        package,
        option::some(market),
    );
}
