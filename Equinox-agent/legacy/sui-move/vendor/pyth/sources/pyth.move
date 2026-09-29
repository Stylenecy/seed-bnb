/// Vendored interface — `get_price_no_older_than` signature copied verbatim from
/// pyth::pyth. The body is a stub: at runtime the call dispatches to the on-chain
/// Pyth package (via `published-at`), so this body never executes — it exists only
/// so our package type-checks against the real signature.
module pyth::pyth;

use sui::clock::Clock;
use pyth::price::Price;
use pyth::price_info::PriceInfoObject;

public fun get_price_no_older_than(
    _price_info_object: &PriceInfoObject,
    _clock: &Clock,
    _max_age_secs: u64,
): Price {
    abort 0
}

public fun get_price_unsafe(_price_info_object: &PriceInfoObject): Price {
    abort 0
}
