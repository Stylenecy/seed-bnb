// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal Venus Protocol vToken (VBep20) interface. Venus is the main
///         money market on BNB Smart Chain (Compound-style: 0 == success).
interface IVBep20 {
    function underlying() external view returns (address);
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
}
