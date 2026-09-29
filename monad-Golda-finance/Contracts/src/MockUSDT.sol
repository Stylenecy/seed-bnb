// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet stand-in for BSC USDT (18 decimals, like BEP-20 USDT on BSC mainnet).
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "USDT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
