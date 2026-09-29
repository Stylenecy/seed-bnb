// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {EquinoxRegistry} from "../src/EquinoxRegistry.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {NativePool} from "../src/NativePool.sol";
import {ShadowPool} from "../src/ShadowPool.sol";
import {EquinoxVaults} from "../src/EquinoxVaults.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @notice Deploys + bootstraps Equinox on BNB Smart Chain.
///
///   BSC Testnet (97): if COLLATERAL_TOKEN / DEBT_TOKEN are unset, deploys 18-dec
///   mocks (tWBNB, tUSDT). BSC Mainnet (56): both env vars are REQUIRED
///   (WBNB 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c,
///    USDT 0x55d398326f99059fF775485246999027B3197955, 18 decimals).
///
///   forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --broadcast
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address agent = vm.envOr("AGENT_ADDRESS", deployer);
        address keeper = vm.envOr("ORACLE_KEEPER_ADDRESS", deployer);
        address collateral = vm.envOr("COLLATERAL_TOKEN", address(0));
        address debt = vm.envOr("DEBT_TOKEN", address(0));
        address collateralFeed = vm.envOr("COLLATERAL_PRICE_FEED", address(0));
        address debtFeed = vm.envOr("DEBT_PRICE_FEED", address(0));

        vm.startBroadcast(pk);

        if (collateral == address(0) || debt == address(0)) {
            require(block.chainid != 56, "set COLLATERAL_TOKEN and DEBT_TOKEN on mainnet");
            MockERC20 tWbnb = new MockERC20("Test Wrapped BNB", "tWBNB", 18);
            MockERC20 tUsdt = new MockERC20("Test Tether USD", "tUSDT", 18);
            collateral = address(tWbnb);
            debt = address(tUsdt);
            console.log("tWBNB (mock):", collateral);
            console.log("tUSDT (mock):", debt);
        }

        EquinoxRegistry reg = new EquinoxRegistry(deployer);
        PriceOracle oracle = new PriceOracle(reg);
        EquinoxVaults vaults = new EquinoxVaults(reg, oracle);
        NativePool lender = new NativePool(reg, IERC20(debt));
        NativePool collateralPool = new NativePool(reg, IERC20(collateral));
        ShadowPool shadow = new ShadowPool(reg, IERC20(debt));

        reg.grantRole(reg.AGENT_ROLE(), agent);
        reg.grantRole(reg.ORACLE_ROLE(), keeper);

        // Risk params (same as the original Move test suite): collateral 60% max LTV /
        // 80% liq threshold; stable 90% / 95%.
        reg.registerAsset(collateral, 6_000, 8_000, IERC20Metadata(collateral).decimals(), collateralFeed);
        reg.registerAsset(debt, 9_000, 9_500, IERC20Metadata(debt).decimals(), debtFeed);

        lender.setOperator(address(vaults));
        shadow.setOperator(address(vaults));
        vaults.setLender(debt, lender);

        reg.registerVenue(reg.VENUE_NATIVE(), "native-usdt", address(lender), address(0));
        reg.registerVenue(reg.VENUE_NATIVE(), "native-wbnb", address(collateralPool), address(0));

        vm.stopBroadcast();

        console.log("chainId:", block.chainid);
        console.log("EquinoxRegistry:", address(reg));
        console.log("PriceOracle:", address(oracle));
        console.log("EquinoxVaults:", address(vaults));
        console.log("NativePool (debt lender):", address(lender));
        console.log("NativePool (collateral venue):", address(collateralPool));
        console.log("ShadowPool:", address(shadow));
    }
}
