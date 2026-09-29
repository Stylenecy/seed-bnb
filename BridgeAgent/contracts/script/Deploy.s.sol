// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {TradeJournal} from "../src/TradeJournal.sol";

/// @notice Deploy IdentityRegistry then TradeJournal (which references it).
/// @dev    forge script script/Deploy.s.sol \
///             --rpc-url bsc_testnet \
///             --private-key $PRIVATE_KEY \
///             --broadcast --verify
contract Deploy is Script {
    function run() external returns (IdentityRegistry registry, TradeJournal journal) {
        vm.startBroadcast();

        registry = new IdentityRegistry();
        console2.log("IdentityRegistry deployed at:", address(registry));

        journal = new TradeJournal(registry);
        console2.log("TradeJournal     deployed at:", address(journal));

        vm.stopBroadcast();
    }
}
