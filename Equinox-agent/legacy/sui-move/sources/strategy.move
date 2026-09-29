/// The strategy/adapter convention — how capital moves between an Equinox vault
/// and an external DeFi venue (Scallop, Navi, …) WITHOUT the core package
/// depending on those protocols at compile time.
///
/// ## Why a hot potato
/// Move has no dynamic dispatch, so the vault cannot "call into" an arbitrary
/// venue. Instead the round-trip is composed in a single Programmable
/// Transaction Block (PTB):
///
/// ```text
///   1. vault::enter_strategy<T>(...)        -> (Coin<T>, StrategyTicket)
///   2. <venue>::deposit(coin, ...)          -> Position           (external pkg)
///   3. vault::record_position<T,P>(vault, ticket, position)       (stores P)
///   4. vault::settle(vault, ticket)                               (consumes ticket)
/// ```
///
/// `StrategyTicket` has NO abilities (no `store`/`copy`/`drop`), so the PTB is
/// physically unable to finish until it is handed back to the vault and
/// destroyed. That is what guarantees funds can't leave without a position (or
/// the underlying) returning, even though the venue call is untrusted.
module equinox::strategy;

use std::string::String;

const EWrongVault: u64 = 1;
const ENotFilled: u64 = 2;
const ESlippage: u64 = 3;

/// Hot potato proving an in-flight strategy round-trip. Created by the vault
/// when capital leaves; destroyed by the vault on settle.
public struct StrategyTicket {
    /// The vault this ticket belongs to.
    vault_id: ID,
    /// Venue name as registered in `registry` (e.g. "scallop-usdc").
    venue: String,
    /// Underlying value that left the vault for this round-trip.
    amount_out: u64,
    /// Minimum underlying value that must come back (slippage / loss guard).
    min_return: u64,
    /// Flipped once a position or the underlying has been handed back.
    filled: bool,
    /// Underlying value credited back to the vault on fill.
    realized: u64,
}

/// Open a ticket. Package-internal: only the vault mints these.
public(package) fun new_ticket(
    vault_id: ID,
    venue: String,
    amount_out: u64,
    min_return: u64,
): StrategyTicket {
    StrategyTicket { vault_id, venue, amount_out, min_return, filled: false, realized: 0 }
}

/// Record that the round-trip was satisfied, crediting `realized` underlying.
public(package) fun mark_filled(ticket: &mut StrategyTicket, realized: u64) {
    ticket.filled = true;
    ticket.realized = realized;
}

/// Consume the ticket, enforcing it was filled, belongs to `expected_vault`, and
/// met the slippage guard. Returns (venue, amount_out, realized).
public(package) fun resolve(ticket: StrategyTicket, expected_vault: ID): (String, u64, u64) {
    let StrategyTicket { vault_id, venue, amount_out, min_return, filled, realized } = ticket;
    assert!(vault_id == expected_vault, EWrongVault);
    assert!(filled, ENotFilled);
    assert!(realized >= min_return, ESlippage);
    (venue, amount_out, realized)
}

// === Read-only accessors (usable by adapters / off-chain) ===

public fun ticket_vault(t: &StrategyTicket): ID { t.vault_id }
public fun ticket_venue(t: &StrategyTicket): String { t.venue }
public fun ticket_amount_out(t: &StrategyTicket): u64 { t.amount_out }
public fun ticket_min_return(t: &StrategyTicket): u64 { t.min_return }
public fun ticket_filled(t: &StrategyTicket): bool { t.filled }
public fun ticket_realized(t: &StrategyTicket): u64 { t.realized }
