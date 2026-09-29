// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LanceHub } from "../src/LanceHub.sol";
import { LanceHubProxy } from "../src/LanceHubProxy.sol";

/// @notice Multichain expansion: deploy LanceHub (impl + ERC-1967 proxy) on BNB Chain (BSC testnet 97 by
/// default, BSC mainnet 56), then seed it at the cheap rate (1 WBNB = 1000 LANCE).
///
/// The pool asset is WBNB (native BNB is not an ERC20, so the ERC-4626 vault uses
/// the wrapped token). Defaults to the canonical WBNB for the current chain; override
/// with POOL_ASSET (e.g. a MockERC20 on testnet). Owner defaults to the deployer;
/// set OWNER to an operator Safe for production.
///
/// The seed deposits SEED_AMOUNT and mints SEED_AMOUNT * 1000 $LANCE to the deployer
/// (backed, recoverable). The deployer must hold >= SEED_AMOUNT of the pool asset
/// (wrap BNB via WBNB.deposit() first). Set SEED_AMOUNT=0 to skip seeding.
contract DeployBsc is Script {
    address constant WBNB_MAINNET = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c; // WBNB, BSC 56
    address constant WBNB_TESTNET = 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd; // WBNB, BSC testnet 97
    uint16 constant REDEEM_FEE_BPS = 100; // 1%

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address asset = vm.envOr("POOL_ASSET", _defaultAsset());
        address owner = vm.envOr("OWNER", deployer);
        uint256 seedAmount = vm.envOr("SEED_AMOUNT", uint256(0.01 ether)); // 0.01 WBNB -> 10 LANCE
        require(asset != address(0), "POOL_ASSET not set for this chain");

        vm.startBroadcast(pk);

        LanceHub impl = new LanceHub();
        bytes memory init = abi.encodeCall(LanceHub.initialize, (IERC20(asset), owner, REDEEM_FEE_BPS));
        LanceHub hub = LanceHub(address(new LanceHubProxy(address(impl), init)));

        // seed at the cheap rate (one-shot; also closes the deposit gate)
        if (seedAmount > 0) {
            IERC20(asset).approve(address(hub), seedAmount);
            hub.seed(seedAmount);
        }

        vm.stopBroadcast();

        console2.log("chainId       :", block.chainid);
        console2.log("LanceHub impl :", address(impl));
        console2.log("LanceHub proxy:", address(hub));
        console2.log("owner         :", owner);
        console2.log("asset (WBNB)  :", asset);
        console2.log("seeded        :", seedAmount);
    }

    function _defaultAsset() internal view returns (address) {
        if (block.chainid == 56) return WBNB_MAINNET;
        if (block.chainid == 97) return WBNB_TESTNET;
        return address(0);
    }
}
