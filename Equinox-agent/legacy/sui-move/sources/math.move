/// Shared fixed-point math for Equinox. Ratios are expressed in basis points
/// (bps): 10_000 bps = 100%. All multiplications go through u128 to avoid
/// intermediate overflow before narrowing back to u64.
module equinox::math;

/// 100% in basis points.
const BPS: u64 = 10_000;

/// Sentinel returned by `health_factor_bps` when there is no debt (infinitely
/// safe). Large but far from u64::MAX so callers can still do arithmetic on it.
const HF_INFINITE: u64 = 1_000_000_000;

/// 100% expressed in bps (10_000).
public fun bps_denominator(): u64 { BPS }

/// floor(a * b / c), computed in u128. Aborts on divide-by-zero (c == 0).
public fun mul_div(a: u64, b: u64, c: u64): u64 {
    (((a as u128) * (b as u128)) / (c as u128)) as u64
}

/// value * bps / 10_000 (e.g. apply a 55% LTV: `apply_bps(collateral, 5500)`).
public fun apply_bps(value: u64, bps: u64): u64 {
    mul_div(value, bps, BPS)
}

/// Loan-to-value in bps = debt_value * 10_000 / collateral_value.
/// Returns 0 when there is no collateral.
public fun ltv_bps(debt_value: u64, collateral_value: u64): u64 {
    if (collateral_value == 0) return 0;
    mul_div(debt_value, BPS, collateral_value)
}

/// Health factor in bps = (collateral_value * liq_threshold_bps) / debt_value.
/// HF >= 10_000 means the position is at or above 1.0 (safe). Returns
/// `HF_INFINITE` when there is no debt.
public fun health_factor_bps(
    collateral_value: u64,
    liq_threshold_bps: u64,
    debt_value: u64,
): u64 {
    if (debt_value == 0) return HF_INFINITE;
    let weighted = ((collateral_value as u128) * (liq_threshold_bps as u128)) / (BPS as u128);
    ((weighted * (BPS as u128)) / (debt_value as u128)) as u64
}

/// The HF value that represents "no debt / infinitely safe".
public fun hf_infinite(): u64 { HF_INFINITE }

/// Min / max helpers used across modules.
public fun min(a: u64, b: u64): u64 { if (a < b) a else b }
public fun max(a: u64, b: u64): u64 { if (a > b) a else b }

#[test]
fun test_bps_and_ltv() {
    assert!(apply_bps(1_000, 5_500) == 550, 0);
    assert!(ltv_bps(550, 1_000) == 5_500, 1);
    assert!(ltv_bps(1, 0) == 0, 2);
}

#[test]
fun test_health_factor() {
    // collateral 1000, liq threshold 80%, debt 600 -> HF = (1000*0.8)/600 = 1.333x
    assert!(health_factor_bps(1_000, 8_000, 600) == 13_333, 0);
    // no debt -> infinite
    assert!(health_factor_bps(1_000, 8_000, 0) == hf_infinite(), 1);
    // underwater: collateral 1000, threshold 80%, debt 1000 -> HF = 0.8x = 8000 bps
    assert!(health_factor_bps(1_000, 8_000, 1_000) == 8_000, 2);
}
