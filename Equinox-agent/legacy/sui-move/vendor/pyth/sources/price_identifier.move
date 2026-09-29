/// Vendored interface — layout copied verbatim from pyth::price_identifier.
module pyth::price_identifier;

public struct PriceIdentifier has copy, drop, store {
    bytes: vector<u8>,
}

public fun get_bytes(pi: &PriceIdentifier): vector<u8> { pi.bytes }
