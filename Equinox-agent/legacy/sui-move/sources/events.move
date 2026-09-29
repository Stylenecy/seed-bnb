/// Centralized event definitions. Other modules in the package emit through the
/// `public(package)` helpers here so event shapes stay consistent and in one
/// place. Event structs need `copy, drop`.
module equinox::events;

use std::string::String;
use std::type_name::{Self, TypeName};
use sui::event;

public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address,
    asset: TypeName,
}

public struct Deposited has copy, drop {
    vault_id: ID,
    amount: u64,
    new_collateral: u64,
}

public struct Withdrawn has copy, drop {
    vault_id: ID,
    amount: u64,
    new_collateral: u64,
}

public struct StrategyEntered has copy, drop {
    vault_id: ID,
    venue: String,
    amount: u64,
}

public struct StrategyExited has copy, drop {
    vault_id: ID,
    venue: String,
    returned: u64,
}

public struct SpreadCaptured has copy, drop {
    vault_id: ID,
    amount: u64,
}

public struct DefenseTriggered has copy, drop {
    vault_id: ID,
    health_factor_bps: u64,
    repaid: u64,
}

public struct VenueRegistered has copy, drop {
    venue: String,
    kind: u8,
}

public struct ShadowCredited has copy, drop {
    owner: address,
    amount: u64,
}

public struct ShadowWithdrawn has copy, drop {
    owner: address,
    amount: u64,
}

public(package) fun vault_created<T>(vault_id: ID, owner: address) {
    event::emit(VaultCreated { vault_id, owner, asset: type_name::with_defining_ids<T>() });
}

public(package) fun deposited(vault_id: ID, amount: u64, new_collateral: u64) {
    event::emit(Deposited { vault_id, amount, new_collateral });
}

public(package) fun withdrawn(vault_id: ID, amount: u64, new_collateral: u64) {
    event::emit(Withdrawn { vault_id, amount, new_collateral });
}

public(package) fun strategy_entered(vault_id: ID, venue: String, amount: u64) {
    event::emit(StrategyEntered { vault_id, venue, amount });
}

public(package) fun strategy_exited(vault_id: ID, venue: String, returned: u64) {
    event::emit(StrategyExited { vault_id, venue, returned });
}

public(package) fun spread_captured(vault_id: ID, amount: u64) {
    event::emit(SpreadCaptured { vault_id, amount });
}

public(package) fun defense_triggered(vault_id: ID, health_factor_bps: u64, repaid: u64) {
    event::emit(DefenseTriggered { vault_id, health_factor_bps, repaid });
}

public(package) fun venue_registered(venue: String, kind: u8) {
    event::emit(VenueRegistered { venue, kind });
}

public(package) fun shadow_credited(owner: address, amount: u64) {
    event::emit(ShadowCredited { owner, amount });
}

public(package) fun shadow_withdrawn(owner: address, amount: u64) {
    event::emit(ShadowWithdrawn { owner, amount });
}
