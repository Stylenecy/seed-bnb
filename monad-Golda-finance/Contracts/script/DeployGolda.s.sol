// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {GoldaVault} from "../src/GoldaVault.sol";
import {MockPAXG} from "../src/MockPAXG.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

/// Deploys Golda to BNB Chain.
/// - BSC Testnet (97): deploys MockUSDT (18 dec) + MockPAXG unless STABLE_TOKEN / PAXG_TOKEN are set.
/// - BSC Mainnet (56): set STABLE_TOKEN (e.g. USDT 0x55d398326f99059fF775485246999027B3197955, 18 dec)
///   and PAXG_TOKEN (TODO: verify BEP-20 PAXG address) plus PANCAKE_V3_POOL for the TWAP.
contract DeployGolda is Script {
    // LI.FI Diamond (same address on BSC mainnet as on other EVM chains). LI.FI has no BSC testnet deployment.
    address constant LIFI_DIAMOND_DEFAULT = 0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE;

    // GenericSwapFacetV3 selectors, verified registered on the BSC mainnet LI.FI Diamond via facetAddress(bytes4).
    // (The old 0x4630a0d8 swapTokensGeneric / 0xd6a4bc50 standardizedCall are NOT registered on BSC.)
    bytes4 constant SELECTOR_SWAP_SINGLE_V3 = 0x4666fc80; // swapTokensSingleV3ERC20ToERC20
    bytes4 constant SELECTOR_SWAP_MULTI_V3 = 0x5fd9ae2e; // swapTokensMultipleV3ERC20ToERC20

    function run() external {
        address stable = vm.envOr("STABLE_TOKEN", address(0));
        address paxgAddr = vm.envOr("PAXG_TOKEN", address(0));
        address pool = vm.envOr("PANCAKE_V3_POOL", address(0));
        address lifi = vm.envOr("LIFI_DIAMOND", LIFI_DIAMOND_DEFAULT);

        vm.startBroadcast();

        if (stable == address(0)) {
            MockUSDT usdt = new MockUSDT();
            usdt.mint(msg.sender, 1_000_000 * 1e18);
            stable = address(usdt);
            console2.log("MockUSDT:", stable);
        }

        if (paxgAddr == address(0)) {
            MockPAXG paxg = new MockPAXG();
            paxg.mint(msg.sender, 100 * 1e18);
            paxgAddr = address(paxg);
            console2.log("MockPAXG:", paxgAddr);
        }

        GoldaVault vault = new GoldaVault(IERC20(stable), IERC20(paxgAddr), pool, lifi, msg.sender);
        console2.log("GoldaVault:", address(vault));

        vault.setAllowedSelector(SELECTOR_SWAP_SINGLE_V3, true);
        vault.setAllowedSelector(SELECTOR_SWAP_MULTI_V3, true);

        vm.stopBroadcast();

        console2.log("Chain ID:", block.chainid);
        console2.log("Stable:", stable);
        console2.log("LI.FI:", lifi);
        console2.log("Agent:", msg.sender);
    }
}
