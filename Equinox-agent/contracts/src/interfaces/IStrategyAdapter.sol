// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IStrategyAdapter
/// @notice EVM replacement for the Sui "hot potato" StrategyTicket convention.
///         On Sui the vault handed a coin out and a ticket forced the PTB to bring
///         a position back. On BNB Chain the round-trip is a single atomic call:
///         the vault approves `amount`, calls `deposit`, and checks the result
///         (slippage guard) before the transaction can succeed.
interface IStrategyAdapter {
    /// @return The ERC-20 this adapter accepts.
    function asset() external view returns (address);

    /// Pull `amount` of `asset()` from msg.sender and deploy it.
    /// @return positionRef Opaque handle the caller stores (e.g. receipt id or vToken amount).
    /// @return realized    Underlying value credited for this deposit.
    function deposit(uint256 amount) external returns (uint256 positionRef, uint256 realized);

    /// Redeem `positionRef` and send the underlying back to msg.sender.
    /// @return amountOut Underlying returned.
    function withdraw(uint256 positionRef) external returns (uint256 amountOut);
}
