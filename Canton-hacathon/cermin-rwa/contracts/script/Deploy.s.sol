// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CerminRWA} from "../src/CerminRWA.sol";
import {MockToken} from "../src/MockToken.sol";
import {RwaPriceFeed} from "../src/RwaPriceFeed.sol";

/// @title Deploy — Cermin-RWA to BNB Chain (BSC testnet 97 by default).
/// @notice Replaces the Daml `Cermin.Scripts.Setup` script. The deployer key acts
///         as issuer + pool operator + oracle (the backend's OPERATOR_PRIVATE_KEY);
///         the Guard Agent is a separate address (GUARD_AGENT_ADDRESS).
///
///   forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet \
///     --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $BSCSCAN_API_KEY
contract Deploy is Script {
    bytes32 constant INSTRUMENT = "mUST-2030";

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address operator = vm.addr(pk);
        address guard = vm.envAddress("GUARD_AGENT_ADDRESS");
        uint256 poolLiquidity = vm.envOr("POOL_LIQUIDITY", uint256(10_000_000e18));
        uint256 couponReserve = vm.envOr("COUPON_RESERVE", uint256(1_000_000e18));
        uint64 maturity = uint64(vm.envOr("MUST_MATURITY", uint256(1_902_096_000))); // 2030-04-10

        console2.log("Operator (issuer/pool/oracle):", operator);
        console2.log("Guard Agent:                  ", guard);
        console2.log("Chain ID:                     ", block.chainid);

        vm.startBroadcast(pk);
        MockToken must = new MockToken("Mock US Treasury 2030", "mUST", operator);
        MockToken musd = new MockToken("Mock USD", "mUSD", operator);
        RwaPriceFeed feed = new RwaPriceFeed(operator);
        CerminRWA rwa = new CerminRWA(
            address(must), address(musd), address(feed), INSTRUMENT, 450, maturity, operator, operator
        );

        feed.updatePrice(INSTRUMENT, 1e18);
        // Pool liquidity + issuer coupon reserve (operator plays both roles).
        musd.mint(operator, poolLiquidity + couponReserve);
        musd.approve(address(rwa), type(uint256).max);
        vm.stopBroadcast();

        console2.log("\n=== DEPLOY DONE === copy into backend/.env and agent/.env:");
        console2.log("CERMIN_RWA_ADDRESS=%s", address(rwa));
        console2.log("MUST_ADDRESS=%s", address(must));
        console2.log("MUSD_ADDRESS=%s", address(musd));
        console2.log("PRICE_FEED_ADDRESS=%s", address(feed));
    }
}
