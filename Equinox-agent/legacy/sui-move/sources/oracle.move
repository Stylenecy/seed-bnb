/// USD price oracle for cross-asset valuation. This is what lets a position have
/// collateral in one asset and debt in another and still compute a correct health
/// factor — without it, HF only made sense for a same-asset position.
///
/// ## Pyth as the source
/// Prices are **sourced from Pyth**. Two paths:
///
/// 1. **Now (keeper push):** the off-chain agent pulls signed prices from Pyth
///    Hermes and writes them here via `set_price` under an `OracleCap`. Use
///    `from_pyth` to normalize a Pyth `(mantissa, expo)` into our 8-dp USD format.
///    Build is dependency-free; trust rests on the (revocable) `OracleCap`.
///
/// 2. **Trustless upgrade (direct on-chain read):** add the Pyth Move dependency
///    and read the price object on-chain. The PTB first updates the feed, then
///    your call reads it:
///    ```move
///    // requires `Pyth = { ... }` (+ Wormhole) in Move.toml
///    use pyth::pyth;
///    use pyth::price; use pyth::price_info::PriceInfoObject;
///    let p = pyth::get_price_no_older_than(price_info_object, clock, MAX_AGE_SECS);
///    let mantissa = price::get_price(&p);   // I64
///    let expo     = price::get_expo(&p);    // I64 (usually negative)
///    // -> oracle::from_pyth(mantissa_mag, expo_is_negative, expo_mag) -> set_price
///    ```
///    PTB side (TS): `SuiPythClient.updatePriceFeeds(tx, updateData, ids)` returns
///    the `PriceInfoObject` ids to pass in. Sui testnet uses Hermes-beta and the
///    feed id WITHOUT the `0x` prefix.
///
/// ## Status of the direct-read path (investigated 2026-06)
/// Adding the Pyth Move dep is currently blocked for our toolchain:
///  - **git dep** (`pyth-crosschain/target_chains/sui/contracts`) pins an OLD
///    `sui-framework` rev + uses legacy `[addresses]`, conflicting with CLI
///    1.73.x's auto-resolved framework (and drags in Wormhole, also pinned).
///  - **MVR** (`@pyth/pyth`) has no on-chain mapping on **testnet** (resolves
///    "package does not exist"); it may exist on mainnet (verify the name).
/// So for now the **keeper push** path (above) is the working integration. Wire
/// the direct read once a testnet MVR mapping is available or the framework
/// versions are aligned.
module equinox::oracle;

use std::type_name::{Self, TypeName};
use sui::clock::Clock;
use sui::vec_map::{Self, VecMap};
use equinox::access::AdminCap;
use equinox::registry::{Self, Registry};
use pyth::pyth;
use pyth::price;
use pyth::i64;
use pyth::price_info::{Self, PriceInfoObject};
use pyth::price_identifier;

/// All USD prices are carried with 8 decimals (e.g. `$1.2345` -> `123_450_000`).
const PRICE_DECIMALS: u8 = 8;

const EStale: u64 = 1;
const EMissing: u64 = 2;
const EWrongFeed: u64 = 3;

/// Authority to push prices. Held by the off-chain oracle keeper. Revocable.
public struct OracleCap has key, store { id: UID }

public struct PriceEntry has store, copy, drop {
    /// USD price * 1e8.
    price_8dp: u64,
    /// `Clock` ms at which this price was written.
    published_ms: u64,
}

/// Shared singleton: latest USD price per asset `TypeName`.
public struct PriceCache has key {
    id: UID,
    prices: VecMap<TypeName, PriceEntry>,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(PriceCache { id: object::new(ctx), prices: vec_map::empty() });
}

// === Cap management ===

public fun new_oracle_cap(_admin: &AdminCap, ctx: &mut TxContext): OracleCap {
    OracleCap { id: object::new(ctx) }
}

entry fun issue_oracle_cap(admin: &AdminCap, keeper: address, ctx: &mut TxContext) {
    transfer::transfer(new_oracle_cap(admin, ctx), keeper);
}

public fun revoke_oracle_cap(cap: OracleCap) {
    let OracleCap { id } = cap;
    id.delete();
}

// === Writing prices (keeper) ===

/// Push the latest USD price (already normalized to 8 dp) for asset `T`.
public fun set_price<T>(
    cache: &mut PriceCache,
    _cap: &OracleCap,
    price_8dp: u64,
    clock: &Clock,
) {
    let key = type_name::with_defining_ids<T>();
    let entry = PriceEntry { price_8dp, published_ms: clock.timestamp_ms() };
    if (cache.prices.contains(&key)) {
        *cache.prices.get_mut(&key) = entry;
    } else {
        cache.prices.insert(key, entry);
    };
}

// === Trustless update: read the verified Pyth price on-chain ===

/// Permissionless + trustless: read asset `T`'s price directly from its Pyth
/// `PriceInfoObject` and write it to the cache. The caller (backend/keeper/user)
/// must have updated the feed earlier in the same PTB
/// (`SuiPythClient.updatePriceFeeds`), so the price is fresh and Pyth/Wormhole
/// signature-verified on-chain. The feed-id guard ensures the passed object is
/// `T`'s feed (registry `oracle_feed<T>` holds the 32-byte Pyth feed id).
///
/// No `OracleCap` — the price comes from Pyth, not a trusted pusher. This is the
/// mainnet-grade path; `set_price` (keeper push) remains for environments where
/// the direct read isn't wired.
public fun refresh_from_pyth<T>(
    cache: &mut PriceCache,
    reg: &Registry,
    price_info_object: &PriceInfoObject,
    max_age_secs: u64,
    clock: &Clock,
) {
    // Guard: the object must be T's feed.
    let info = price_info::get_price_info_from_price_info_object(price_info_object);
    let feed = price_identifier::get_bytes(&price_info::get_price_identifier(&info));
    assert!(feed == registry::oracle_feed<T>(reg), EWrongFeed);

    // Verified, fresh price from Pyth.
    let p = pyth::get_price_no_older_than(price_info_object, clock, max_age_secs);
    let mantissa = i64::get_magnitude_if_positive(&price::get_price(&p)); // prices are positive
    let expo = price::get_expo(&p);
    let expo_neg = i64::get_is_negative(&expo);
    let expo_mag = if (expo_neg) i64::get_magnitude_if_negative(&expo) else i64::get_magnitude_if_positive(&expo);

    let entry = PriceEntry {
        price_8dp: from_pyth(mantissa, expo_neg, (expo_mag as u8)),
        published_ms: clock.timestamp_ms(),
    };
    let key = type_name::with_defining_ids<T>();
    if (cache.prices.contains(&key)) {
        *cache.prices.get_mut(&key) = entry;
    } else {
        cache.prices.insert(key, entry);
    };
}

// === Reading prices ===

/// USD price (8 dp) for `T`. Aborts if missing or older than `max_age_ms`.
public fun price_of<T>(cache: &PriceCache, clock: &Clock, max_age_ms: u64): u64 {
    let key = type_name::with_defining_ids<T>();
    assert!(cache.prices.contains(&key), EMissing);
    let e = cache.prices.get(&key);
    assert!(clock.timestamp_ms() <= e.published_ms + max_age_ms, EStale);
    e.price_8dp
}

public fun has_price<T>(cache: &PriceCache): bool {
    cache.prices.contains(&type_name::with_defining_ids<T>())
}

/// USD value (8 dp) of `amount` of `T`, given the asset's on-chain `decimals`.
/// value = amount / 10^decimals * price.
public fun usd_value<T>(
    cache: &PriceCache,
    amount: u64,
    decimals: u8,
    clock: &Clock,
    max_age_ms: u64,
): u64 {
    let p = price_of<T>(cache, clock, max_age_ms) as u128;
    (((amount as u128) * p) / pow10(decimals)) as u64
}

/// Inverse of `usd_value`: how many units of `T` (at `decimals`) equal
/// `usd_8dp` USD. amount = usd / price * 10^decimals.
public fun amount_from_usd<T>(
    cache: &PriceCache,
    usd_8dp: u64,
    decimals: u8,
    clock: &Clock,
    max_age_ms: u64,
): u64 {
    let p = price_of<T>(cache, clock, max_age_ms) as u128;
    (((usd_8dp as u128) * pow10(decimals)) / p) as u64
}

/// Normalize a Pyth price `mantissa * 10^expo` into our 8-dp USD format.
/// `expo` from Pyth is usually negative, e.g. price `123_450_000` expo `-8`.
public fun from_pyth(mantissa: u64, expo_is_negative: bool, expo_magnitude: u8): u64 {
    let m = mantissa as u128;
    let v = if (expo_is_negative) {
        if (expo_magnitude <= PRICE_DECIMALS) {
            m * pow10(PRICE_DECIMALS - expo_magnitude)
        } else {
            m / pow10(expo_magnitude - PRICE_DECIMALS)
        }
    } else {
        m * pow10(PRICE_DECIMALS + expo_magnitude)
    };
    v as u64
}

public fun price_decimals(): u8 { PRICE_DECIMALS }

fun pow10(n: u8): u128 {
    let mut r = 1u128;
    let mut i: u8 = 0;
    while (i < n) { r = r * 10; i = i + 1; };
    r
}

#[test_only]
public fun new_cache_for_testing(ctx: &mut TxContext): PriceCache {
    PriceCache { id: object::new(ctx), prices: vec_map::empty() }
}

#[test]
fun test_from_pyth() {
    // $1.2345 with expo -8 -> 123_450_000 (already 8dp)
    assert!(from_pyth(123_450_000, true, 8) == 123_450_000, 0);
    // $2.00 with expo -2 (200) -> scale up to 8dp = 200_000_000
    assert!(from_pyth(200, true, 2) == 200_000_000, 1);
    // expo deeper than 8: 12_345_000_000 expo -10 -> /100 = 123_450_000
    assert!(from_pyth(12_345_000_000, true, 10) == 123_450_000, 2);
}
