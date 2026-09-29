// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title LanceHubProxy — ERC-1967 proxy for the upgradeable LanceHub.
contract LanceHubProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) { }
}
