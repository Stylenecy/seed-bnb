// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LanceHub } from "../src/LanceHub.sol";
import { LanceHubProxy } from "../src/LanceHubProxy.sol";

/// @notice Deploy LanceHub (impl + ERC-1967 proxy) on Celo mainnet, then seed it
/// at the cheap rate (1 CELO = 1000 LANCE). Owner = operator Safe multisig.
///
/// The seed deposits SEED_CELO and mints SEED_CELO * 1000 $LANCE to the deployer
/// (backed, recoverable) — the deployer then distributes those for play/testing.
/// The seed also sets initial NAV = 0.001 CELO/$LANCE and neutralizes the
/// ERC-4626 inflation attack (large initial supply). Deposits are gated until seeded.
contract Deploy is Script {
    address constant CELO = 0x471EcE3750Da237f93B8E339c536989b8978a438; // CELO ERC20 (pool asset)
    address constant SAFE_OWNER = 0xe9Fc48f315fD4E989637fAcC29AaF2717E19f7F0; // operator Safe (threshold 2)
    uint16 constant REDEEM_FEE_BPS = 100; // 1%
    uint256 constant SEED_CELO = 20 ether; // → 20,000 LANCE minted to deployer for distribution

    function run() external {
        uint256 pk = vm.envUint("MAINNET_DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);

        LanceHub impl = new LanceHub();
        bytes memory init = abi.encodeCall(LanceHub.initialize, (IERC20(CELO), SAFE_OWNER, REDEEM_FEE_BPS));
        LanceHub hub = LanceHub(address(new LanceHubProxy(address(impl), init)));

        // seed at the cheap rate (also closes the deposit gate)
        IERC20(CELO).approve(address(hub), SEED_CELO);
        hub.seed(SEED_CELO);

        vm.stopBroadcast();

        console2.log("LanceHub impl :", address(impl));
        console2.log("LanceHub proxy:", address(hub));
        console2.log("owner (Safe)  :", SAFE_OWNER);
        console2.log("asset (CELO)  :", CELO);
        console2.log("seeded CELO   :", SEED_CELO);
        console2.log("LANCE minted  :", SEED_CELO * hub.SEED_RATE());
    }
}
