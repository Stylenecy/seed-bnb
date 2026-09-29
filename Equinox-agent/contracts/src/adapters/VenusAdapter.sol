// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";
import {IVBep20} from "../interfaces/IVBep20.sol";

/// @title VenusAdapter
/// @notice Strategy venue backed by one Venus vToken (BNB Chain's main money
///         market). Replaces the Sui Scallop/Navi adapters. The vToken address is
///         a constructor argument: nothing is hard-coded.
///
///         Only the EquinoxVaults contract (`vaults`) may call it. `positionRef`
///         is the amount of vTokens minted for that deposit, so each vault's share
///         of Venus interest is tracked exactly.
///
///         Fork-tested against live Venus on BSC mainnet (test/VenusFork.t.sol:
///         vUSDT + vBTC). Needs a BEP-20 vToken: vBNB is native and has no
///         `underlying()`, so WBNB collateral cannot use a Venus venue.
contract VenusAdapter is IStrategyAdapter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NotVaults();
    error VenusError(uint256 code);

    IVBep20 public immutable vToken;
    IERC20 public immutable underlying;
    address public immutable vaults;

    constructor(IVBep20 _vToken, address _vaults) {
        vToken = _vToken;
        underlying = IERC20(_vToken.underlying());
        vaults = _vaults;
    }

    modifier onlyVaults() {
        if (msg.sender != vaults) revert NotVaults();
        _;
    }

    function asset() external view returns (address) {
        return address(underlying);
    }

    function deposit(uint256 amount) external onlyVaults nonReentrant returns (uint256 positionRef, uint256 realized) {
        underlying.safeTransferFrom(msg.sender, address(this), amount);
        underlying.forceApprove(address(vToken), amount);
        uint256 before = vToken.balanceOf(address(this));
        uint256 err = vToken.mint(amount);
        if (err != 0) revert VenusError(err);
        positionRef = vToken.balanceOf(address(this)) - before;
        realized = amount;
    }

    function withdraw(uint256 positionRef) external onlyVaults nonReentrant returns (uint256 amountOut) {
        uint256 before = underlying.balanceOf(address(this));
        uint256 err = vToken.redeem(positionRef);
        if (err != 0) revert VenusError(err);
        amountOut = underlying.balanceOf(address(this)) - before;
        underlying.safeTransfer(msg.sender, amountOut);
    }
}
