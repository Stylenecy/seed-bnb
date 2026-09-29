/// Vendored interface — layout copied verbatim from pyth::price_feed.
module pyth::price_feed;

use pyth::price_identifier::PriceIdentifier;
use pyth::price::Price;

public struct PriceFeed has copy, drop, store {
    price_identifier: PriceIdentifier,
    price: Price,
    ema_price: Price,
}

public fun get_price_identifier(pf: &PriceFeed): PriceIdentifier { pf.price_identifier }
public fun get_price(pf: &PriceFeed): Price { pf.price }
public fun get_ema_price(pf: &PriceFeed): Price { pf.ema_price }
