/// Vendored interface — layout copied verbatim from pyth::price_info.
/// PriceInfoObject is the shared object Pyth keeps per feed; we only ever pass it
/// by reference into `pyth::get_price_no_older_than`, never construct it.
module pyth::price_info;

use pyth::price_feed::{Self, PriceFeed};
use pyth::price_identifier::PriceIdentifier;

public struct PriceInfoObject has key, store {
    id: UID,
    price_info: PriceInfo,
}

public struct PriceInfo has copy, drop, store {
    attestation_time: u64,
    arrival_time: u64,
    price_feed: PriceFeed,
}

public fun get_price_info_from_price_info_object(o: &PriceInfoObject): PriceInfo { o.price_info }
public fun get_price_identifier(info: &PriceInfo): PriceIdentifier {
    price_feed::get_price_identifier(&info.price_feed)
}
