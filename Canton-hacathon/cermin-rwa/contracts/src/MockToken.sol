// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockToken — testnet stand-in for the Daml `TreasuryToken` (mUST) and
///        `StableCoin` (mUSD) templates. 18 decimals, owner-mintable.
/// @notice Port of `Cermin.Assets`. The Daml propose/accept transfer legs,
///         Split and Merge collapse into plain ERC20 balances; Lock/Unlock is
///         modelled as escrow inside `CerminRWA` (collateral is transferred in).
contract MockToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, address owner_) ERC20(name_, symbol_) Ownable(owner_) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
