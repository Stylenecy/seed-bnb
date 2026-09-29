/// Vendored interface — layout copied verbatim from pyth::price.
module pyth::price;

use pyth::i64::I64;

public struct Price has copy, drop, store {
    price: I64,
    conf: u64,
    expo: I64,
    timestamp: u64,
}

public fun get_price(p: &Price): I64 { p.price }
public fun get_conf(p: &Price): u64 { p.conf }
public fun get_expo(p: &Price): I64 { p.expo }
public fun get_timestamp(p: &Price): u64 { p.timestamp }
