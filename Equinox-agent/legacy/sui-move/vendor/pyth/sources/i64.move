/// Vendored interface — layout copied verbatim from pyth::i64. Bodies are real
/// (pure field reads); at runtime, calls dispatch to the on-chain Pyth package.
module pyth::i64;

public struct I64 has copy, drop, store {
    negative: bool,
    magnitude: u64,
}

public fun get_is_negative(v: &I64): bool { v.negative }

public fun get_magnitude_if_positive(v: &I64): u64 {
    assert!(!v.negative, 0);
    v.magnitude
}

public fun get_magnitude_if_negative(v: &I64): u64 {
    assert!(v.negative, 0);
    v.magnitude
}
