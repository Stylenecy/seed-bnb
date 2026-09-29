// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EquinoxRegistry} from "../src/EquinoxRegistry.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {NativePool} from "../src/NativePool.sol";
import {EquinoxVaults} from "../src/EquinoxVaults.sol";
import {VenusAdapter} from "../src/adapters/VenusAdapter.sol";
import {IVBep20} from "../src/interfaces/IVBep20.sol";

/// BSC mainnet fork test of VenusAdapter + Chainlink feeds against live contracts.
/// Skipped unless BSC_FORK_URL is set, e.g.
///   BSC_FORK_URL=https://bsc-rpc.publicnode.com forge test --match-contract VenusForkTest -vv
/// (or point it at a local `anvil --fork-url https://bsc-rpc.publicnode.com --chain-id 56`).
///
/// Note: Venus vBNB (0xA07c...ea36) is a native-BNB market with no `underlying()`, so
/// VenusAdapter cannot target it. A WBNB-collateral vault can't use a Venus venue;
/// BEP-20 collateral (BTCB, ETH, USDT, ...) can.
contract VenusForkTest is Test {
    // BSC mainnet (chain 56), verified with `cast code`.
    address constant USDT = 0x55d398326f99059fF775485246999027B3197955; // 18 dp
    address constant BTCB = 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c; // 18 dp
    address constant V_USDT = 0xfD5840Cd36d94D7229439859C0112a4185BC0255;
    address constant V_BTC = 0x882C173bC7Ff3b7786CA16dfeD3DFFfb9Ee7847B;
    address constant FEED_BTC_USD = 0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf;
    address constant FEED_USDT_USD = 0xB97Ad0E74fa7d920791E90258A6E2085088b4320;

    address agent = makeAddr("agent");
    address user = makeAddr("user");

    EquinoxRegistry reg;
    PriceOracle oracle;
    EquinoxVaults vaults;
    NativePool lender;
    VenusAdapter venusBtc;

    function setUp() public {
        string memory url = vm.envOr("BSC_FORK_URL", string(""));
        if (bytes(url).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(url);
        require(block.chainid == 56, "fork must be BSC mainnet");

        reg = new EquinoxRegistry(address(this));
        oracle = new PriceOracle(reg);
        vaults = new EquinoxVaults(reg, oracle);
        lender = new NativePool(reg, IERC20(USDT));
        lender.setOperator(address(vaults));
        vaults.setLender(USDT, lender);
        reg.grantRole(reg.AGENT_ROLE(), agent);

        reg.registerAsset(BTCB, 6_000, 8_000, 18, FEED_BTC_USD);
        reg.registerAsset(USDT, 9_000, 9_500, 18, FEED_USDT_USD);

        venusBtc = new VenusAdapter(IVBep20(V_BTC), address(vaults));
        reg.registerVenue(reg.VENUE_NATIVE(), "venus-btcb", address(venusBtc), V_BTC);
    }

    function test_fork_chainlink_refresh() public {
        oracle.refreshFromChainlink(BTCB, 1 days);
        oracle.refreshFromChainlink(USDT, 1 days);
        uint256 btc = oracle.priceOf(BTCB, 1 days);
        uint256 usdt = oracle.priceOf(USDT, 1 days);
        emit log_named_uint("BTC/USD 8dp", btc);
        emit log_named_uint("USDT/USD 8dp", usdt);
        assertGt(btc, 10_000e8);
        assertApproxEqRel(usdt, 1e8, 0.05e18);
    }

    function test_fork_venus_adapter_direct_usdt() public {
        VenusAdapter a = new VenusAdapter(IVBep20(V_USDT), address(this));
        assertEq(a.asset(), USDT);
        deal(USDT, address(this), 1_000e18);
        IERC20(USDT).approve(address(a), 1_000e18);
        (uint256 vAmt, uint256 realized) = a.deposit(1_000e18);
        assertGt(vAmt, 0);
        assertEq(realized, 1_000e18);
        assertEq(IVBep20(V_USDT).balanceOf(address(a)), vAmt);

        vm.roll(block.number + 28_800); // ~1 day of blocks: accrue interest
        vm.warp(block.timestamp + 1 days);
        uint256 out = a.withdraw(vAmt);
        emit log_named_uint("USDT back after ~1 day", out);
        assertGe(out, 1_000e18 - 1); // vToken rounding can cost 1 wei
        assertEq(IERC20(USDT).balanceOf(address(this)), out);

        vm.prank(user);
        vm.expectRevert(VenusAdapter.NotVaults.selector);
        a.withdraw(1);
    }

    function test_fork_vault_roundtrip_through_venus() public {
        oracle.refreshFromChainlink(BTCB, 1 days);
        oracle.refreshFromChainlink(USDT, 1 days);

        // Lender liquidity.
        deal(USDT, address(this), 1_000_000e18);
        IERC20(USDT).approve(address(lender), 1_000_000e18);
        lender.fundRewards(1_000_000e18);

        // User vault: 1 BTCB collateral.
        deal(BTCB, user, 1e18);
        vm.startPrank(user);
        uint256 id = vaults.openVault(BTCB, USDT);
        IERC20(BTCB).approve(address(vaults), 1e18);
        vaults.deposit(id, 1e18);
        vaults.openAgent(id, 0, 1, 4_000, 5_000, 15_000);
        vm.stopPrank();

        // Agent deploys 0.5 BTCB into Venus, then skims USDT at 40% LTV.
        vm.startPrank(agent);
        vaults.enterStrategy(id, "venus-btcb", 0.5e18, 0.5e18);
        assertGt(IVBep20(V_BTC).balanceOf(address(venusBtc)), 0);
        assertEq(vaults.collateralValue(id), 1e18);
        uint256 skimmed = vaults.skimToReserve(id, 1 days);
        assertGt(skimmed, 0);
        emit log_named_uint("skimmed USDT", skimmed);
        emit log_named_uint("HF bps", vaults.healthFactorPriced(id, 1 days));

        vm.roll(block.number + 28_800);
        vm.warp(block.timestamp + 1 hours); // keep Chainlink prices within max age
        vaults.exitStrategy(id, "venus-btcb", 0.5e18 - 1);
        vm.stopPrank();

        (,,, uint256 idle,,, uint256 deployed) = vaults.vaults(id);
        assertEq(deployed, 0);
        assertGe(idle, 1e18 - 1);
        emit log_named_uint("idle BTCB after exit", idle);
    }
}
