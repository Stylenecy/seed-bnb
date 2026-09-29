// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EquinoxMath
/// @notice Shared fixed-point math. Ratios are in basis points (10_000 = 100%).
///         Port of `equinox::math` (Sui Move).
library EquinoxMath {
    uint256 internal constant BPS = 10_000;

    /// @dev Returned by `healthFactorBps` when there is no debt (infinitely safe).
    uint256 internal constant HF_INFINITE = 1_000_000_000;

    /// floor(a * b / c). Reverts on c == 0.
    function mulDiv(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {
        return (a * b) / c;
    }

    function applyBps(uint256 value, uint256 bps) internal pure returns (uint256) {
        return mulDiv(value, bps, BPS);
    }

    function ltvBps(uint256 debtValue, uint256 collateralValue) internal pure returns (uint256) {
        if (collateralValue == 0) return 0;
        return mulDiv(debtValue, BPS, collateralValue);
    }

    /// HF (bps) = collateralValue * liqThresholdBps / debtValue. >= 10_000 means >= 1.0x.
    function healthFactorBps(uint256 collateralValue, uint256 liqThresholdBps, uint256 debtValue)
        internal
        pure
        returns (uint256)
    {
        if (debtValue == 0) return HF_INFINITE;
        uint256 weighted = (collateralValue * liqThresholdBps) / BPS;
        return (weighted * BPS) / debtValue;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
