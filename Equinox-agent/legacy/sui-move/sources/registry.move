/// Protocol registry: the single shared object that lists which DeFi venues and
/// which assets the protocol supports, plus the risk parameters for each.
///
/// A "venue" is a (protocol, pool) choice — e.g. `native-usdc`, `scallop-usdc`,
/// `navi-sui`. Registering each pool as its own named venue is how the product
/// lets a user pick *which DeFi* and *which vault*. New venues can be added by
/// the admin without upgrading the core package (and even from a separately
/// published adapter package), which is the modularity goal.
module equinox::registry;

use std::string::String;
use std::type_name::{Self, TypeName};
use sui::vec_map::{Self, VecMap};
use equinox::access::AdminCap;
use equinox::events;

/// Venue kinds.
const VENUE_NATIVE: u8 = 0;
const VENUE_SCALLOP: u8 = 1;
const VENUE_NAVI: u8 = 2;

const EVenueExists: u64 = 1;
const EVenueMissing: u64 = 2;
const EAssetExists: u64 = 3;
const EAssetMissing: u64 = 4;
const EVenueDisabled: u64 = 5;
const EAssetDisabled: u64 = 6;
const EPaused: u64 = 7;
const EBadParams: u64 = 8;

/// Everything a frontend/agent needs to build a PTB against a venue.
public struct VenueConfig has store, copy, drop {
    kind: u8,
    name: String,
    enabled: bool,
    /// Package address of the external protocol (`@0x0` for NATIVE).
    package: address,
    /// Primary shared object the venue's calls operate on (e.g. a Scallop
    /// market or a Navi pool). `none` for NATIVE.
    pool: Option<ID>,
}

/// Per-asset risk parameters, keyed by the asset's coin `TypeName`.
public struct AssetConfig has store, copy, drop {
    /// Max LTV the agent may borrow to, in bps.
    max_ltv_bps: u64,
    /// Liquidation threshold in bps (drives the health factor).
    liq_threshold_bps: u64,
    /// The asset's on-chain decimals (needed to value amounts via the oracle).
    decimals: u8,
    /// Opaque oracle price-feed id (e.g. a Pyth feed id).
    oracle_feed: vector<u8>,
    enabled: bool,
}

/// Shared singleton.
public struct Registry has key {
    id: UID,
    venues: VecMap<String, VenueConfig>,
    assets: VecMap<TypeName, AssetConfig>,
    paused: bool,
}

/// Share an empty registry on publish; the admin populates it afterwards.
fun init(ctx: &mut TxContext) {
    transfer::share_object(Registry {
        id: object::new(ctx),
        venues: vec_map::empty(),
        assets: vec_map::empty(),
        paused: false,
    });
}

// === Admin: venues ===

/// Register a new venue. Aborts if a venue with the same name already exists.
public fun register_venue(
    reg: &mut Registry,
    _admin: &AdminCap,
    kind: u8,
    name: String,
    package: address,
    pool: Option<ID>,
) {
    assert!(kind <= VENUE_NAVI, EBadParams);
    assert!(!reg.venues.contains(&name), EVenueExists);
    reg.venues.insert(name, VenueConfig { kind, name, enabled: true, package, pool });
    events::venue_registered(name, kind);
}

public fun set_venue_enabled(
    reg: &mut Registry,
    _admin: &AdminCap,
    name: String,
    enabled: bool,
) {
    assert!(reg.venues.contains(&name), EVenueMissing);
    reg.venues.get_mut(&name).enabled = enabled;
}

// === Admin: assets ===

/// Register risk params for asset `T`. Aborts if `T` is already registered.
public fun register_asset<T>(
    reg: &mut Registry,
    _admin: &AdminCap,
    max_ltv_bps: u64,
    liq_threshold_bps: u64,
    decimals: u8,
    oracle_feed: vector<u8>,
) {
    assert!(max_ltv_bps <= liq_threshold_bps && liq_threshold_bps <= 10_000, EBadParams);
    let key = type_name::with_defining_ids<T>();
    assert!(!reg.assets.contains(&key), EAssetExists);
    reg.assets.insert(key, AssetConfig {
        max_ltv_bps,
        liq_threshold_bps,
        decimals,
        oracle_feed,
        enabled: true,
    });
}

public fun set_asset_enabled<T>(reg: &mut Registry, _admin: &AdminCap, enabled: bool) {
    let key = type_name::with_defining_ids<T>();
    assert!(reg.assets.contains(&key), EAssetMissing);
    reg.assets.get_mut(&key).enabled = enabled;
}

public fun set_paused(reg: &mut Registry, _admin: &AdminCap, paused: bool) {
    reg.paused = paused;
}

// === Views ===

public fun is_paused(reg: &Registry): bool { reg.paused }

public fun has_venue(reg: &Registry, name: String): bool { reg.venues.contains(&name) }

public fun venue_kind(reg: &Registry, name: String): u8 {
    assert!(reg.venues.contains(&name), EVenueMissing);
    reg.venues.get(&name).kind
}

public fun venue_package(reg: &Registry, name: String): address {
    assert!(reg.venues.contains(&name), EVenueMissing);
    reg.venues.get(&name).package
}

public fun venue_pool(reg: &Registry, name: String): Option<ID> {
    assert!(reg.venues.contains(&name), EVenueMissing);
    reg.venues.get(&name).pool
}

public fun is_venue_enabled(reg: &Registry, name: String): bool {
    reg.venues.contains(&name) && reg.venues.get(&name).enabled
}

public fun has_asset<T>(reg: &Registry): bool {
    reg.assets.contains(&type_name::with_defining_ids<T>())
}

public fun max_ltv_bps<T>(reg: &Registry): u64 {
    let key = type_name::with_defining_ids<T>();
    assert!(reg.assets.contains(&key), EAssetMissing);
    reg.assets.get(&key).max_ltv_bps
}

public fun liq_threshold_bps<T>(reg: &Registry): u64 {
    let key = type_name::with_defining_ids<T>();
    assert!(reg.assets.contains(&key), EAssetMissing);
    reg.assets.get(&key).liq_threshold_bps
}

public fun asset_decimals<T>(reg: &Registry): u8 {
    let key = type_name::with_defining_ids<T>();
    assert!(reg.assets.contains(&key), EAssetMissing);
    reg.assets.get(&key).decimals
}

public fun oracle_feed<T>(reg: &Registry): vector<u8> {
    let key = type_name::with_defining_ids<T>();
    assert!(reg.assets.contains(&key), EAssetMissing);
    reg.assets.get(&key).oracle_feed
}

// === Guards (called by other modules) ===

public fun assert_not_paused(reg: &Registry) {
    assert!(!reg.paused, EPaused);
}

public fun assert_venue_enabled(reg: &Registry, name: String) {
    assert!(reg.venues.contains(&name), EVenueMissing);
    assert!(reg.venues.get(&name).enabled, EVenueDisabled);
}

public fun assert_asset_enabled<T>(reg: &Registry) {
    let key = type_name::with_defining_ids<T>();
    assert!(reg.assets.contains(&key), EAssetMissing);
    assert!(reg.assets.get(&key).enabled, EAssetDisabled);
}

// === Venue-kind constants (for adapters / frontend) ===

public fun venue_native(): u8 { VENUE_NATIVE }
public fun venue_scallop(): u8 { VENUE_SCALLOP }
public fun venue_navi(): u8 { VENUE_NAVI }

#[test_only]
public fun new_for_testing(ctx: &mut TxContext): Registry {
    Registry {
        id: object::new(ctx),
        venues: vec_map::empty(),
        assets: vec_map::empty(),
        paused: false,
    }
}

#[test_only]
public fun destroy_for_testing(reg: Registry) {
    let Registry { id, venues: _, assets: _, paused: _ } = reg;
    id.delete();
}
