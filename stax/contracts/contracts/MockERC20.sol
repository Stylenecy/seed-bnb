// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice TESTNET ONLY. 18-decimal stand-in for BSC USDC/USDT on BSC testnet (chainId 97),
/// matching the 18 decimals of the real Binance-Peg stables on BSC mainnet. Anyone can mint.
contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
