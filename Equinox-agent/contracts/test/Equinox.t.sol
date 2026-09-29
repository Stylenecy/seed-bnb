// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EquinoxRegistry} from "../src/EquinoxRegistry.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {NativePool} from "../src/NativePool.sol";
import {ShadowPool} from "../src/ShadowPool.sol";
import {EquinoxVaults} from "../src/EquinoxVaults.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {AggregatorV3Interface} from "../src/interfaces/AggregatorV3Interface.sol";

/// Exposes a debt setter (the Move tests used the package-internal `increase_debt`).
contract VaultsHarness is EquinoxVaults {
    constructor(EquinoxRegistry r, PriceOracle o) EquinoxVaults(r, o) {}

    function setDebtForTesting(uint256 vaultId, uint256 debt) external {
        vaults[vaultId].debt = debt;
    }
}

contract MockFeed is AggregatorV3Interface {
    int256 public answer;
    uint8 public immutable dec;
    uint256 public updatedAt;

    constructor(uint8 d, int256 a) {
        dec = d;
        answer = a;
        updatedAt = block.timestamp;
    }

    function decimals() external view returns (uint8) {
        return dec;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, answer, updatedAt, updatedAt, 1);
    }
}

/// Port of legacy/sui-move/tests/equinox_tests.move. Same decimals as the Move
/// suite (collateral 9 dp, stable 6 dp) so the expected numbers match 1:1.
contract EquinoxTest is Test {
    address admin = address(this);
    address agent = makeAddr("agent");
    address keeper = makeAddr("keeper");
    address user = address(0xB0B);

    uint256 constant MAX_AGE = 60; // seconds (Move: 60_000 ms)

    EquinoxRegistry reg;
    PriceOracle oracle;
    VaultsHarness vaults;
    MockERC20 usdc; // quote / debt asset (6 dp, as in the Move tests)
    MockERC20 wbnb; // volatile collateral (9 dp, as SUIX in the Move tests)
    NativePool lender; // debt-token lender
    NativePool yieldPool; // collateral venue

    function setUp() public {
        vm.warp(1_700_000_000);
        reg = new EquinoxRegistry(admin);
        oracle = new PriceOracle(reg);
        vaults = new VaultsHarness(reg, oracle);
        reg.grantRole(reg.AGENT_ROLE(), agent);
        reg.grantRole(reg.ORACLE_ROLE(), keeper);

        usdc = new MockERC20("Test USD", "tUSD", 6);
        wbnb = new MockERC20("Test WBNB", "tWBNB", 9);

        lender = new NativePool(reg, IERC20(address(usdc)));
        lender.setOperator(address(vaults));
        vaults.setLender(address(usdc), lender);

        yieldPool = new NativePool(reg, IERC20(address(wbnb)));
        reg.registerVenue(reg.VENUE_NATIVE(), "native-wbnb", address(yieldPool), address(0));

        reg.registerAsset(address(wbnb), 6_000, 8_000, 9, address(0));
        reg.registerAsset(address(usdc), 9_000, 9_500, 6, address(0));
        _setPrice(address(wbnb), 200_000_000); // $2.00
        _setPrice(address(usdc), 100_000_000); // $1.00
    }

    function _setPrice(address token, uint256 p) internal {
        vm.prank(keeper);
        oracle.setPrice(token, p);
    }

    function _openFunded(uint256 collateral) internal returns (uint256 id) {
        vm.startPrank(user);
        id = vaults.openVault(address(wbnb), address(usdc));
        wbnb.mint(user, collateral);
        wbnb.approve(address(vaults), collateral);
        vaults.deposit(id, collateral);
        vm.stopPrank();
    }

    function _fundLender(uint256 amount) internal {
        usdc.mint(address(this), amount);
        usdc.approve(address(lender), amount);
        lender.fundRewards(amount);
    }

    function test_vault_deposit_withdraw() public {
        uint256 id = _openFunded(1_000);
        assertEq(vaults.collateralValue(id), 1_000);
        vm.prank(user);
        vaults.withdraw(id, 400);
        assertEq(wbnb.balanceOf(user), 400);
        (,,, uint256 idle,,,) = vaults.vaults(id);
        assertEq(idle, 600);
    }

    function test_native_strategy_roundtrip() public {
        uint256 id = _openFunded(1_000);
        vm.prank(agent);
        vaults.enterStrategy(id, "native-wbnb", 600, 600);
        (,,,,,, uint256 deployed) = vaults.vaults(id);
        assertEq(deployed, 600);

        vm.prank(agent);
        vaults.exitStrategy(id, "native-wbnb", 600);
        (,,, uint256 idle,,, uint256 deployed2) = vaults.vaults(id);
        assertEq(deployed2, 0);
        assertEq(idle, 1_000);
    }

    function test_cross_asset_health_factor() public {
        uint256 id = _openFunded(1_000_000_000); // 1 WBNB @ $2
        vaults.setDebtForTesting(id, 1_000_000); // 1 USD
        assertEq(vaults.healthFactorPriced(id, MAX_AGE), 16_000);
        _setPrice(address(wbnb), 120_000_000); // $1.20
        assertEq(vaults.healthFactorPriced(id, MAX_AGE), 9_600);
    }

    function test_skim_to_reserve() public {
        _fundLender(5_000_000);
        uint256 id = _openFunded(1_000_000_000);
        vm.prank(user);
        vaults.openAgent(id, 2, 1, 5_000, 4_000, 11_000);

        vm.prank(agent);
        uint256 skimmed = vaults.skimToReserve(id, MAX_AGE);
        assertEq(skimmed, 1_000_000);
        (,,, uint256 idle, uint256 buffer, uint256 debt,) = vaults.vaults(id);
        assertEq(debt, 1_000_000);
        assertEq(buffer, 1_000_000);
        assertEq(idle, 1_000_000_000);
        assertEq(lender.totalBorrowed(), 1_000_000);

        vm.prank(agent);
        assertEq(vaults.skimToReserve(id, MAX_AGE), 0);
    }

    function test_skim_against_deployed_collateral() public {
        _fundLender(5_000_000);
        uint256 id = _openFunded(1_000_000_000);
        vm.prank(agent);
        vaults.enterStrategy(id, "native-wbnb", 600_000_000, 600_000_000);
        assertEq(vaults.collateralValue(id), 1_000_000_000);

        vm.prank(user);
        vaults.openAgent(id, 2, 1, 5_000, 4_000, 11_000);
        vm.prank(agent);
        assertEq(vaults.skimToReserve(id, MAX_AGE), 1_000_000);
    }

    function test_defense_repays_from_reserve() public {
        uint256 id = _openFunded(1_000_000_000);
        usdc.mint(address(this), 500_000);
        usdc.approve(address(vaults), 500_000);
        vaults.fundBuffer(id, 500_000);
        vaults.setDebtForTesting(id, 1_000_000);
        vm.prank(user);
        vaults.openAgent(id, 0, 1, 5_500, 4_000, 11_000);

        vaults.defend(id, MAX_AGE); // healthy: no-op
        (,,,,, uint256 debt0,) = vaults.vaults(id);
        assertEq(debt0, 1_000_000);

        _setPrice(address(wbnb), 120_000_000);
        vm.prank(makeAddr("anyone"));
        vaults.defend(id, MAX_AGE);

        (,,,, uint256 buffer, uint256 debt,) = vaults.vaults(id);
        assertEq(debt, 872_727);
        assertEq(buffer, 372_727);
        assertGe(vaults.healthFactorPriced(id, MAX_AGE), 11_000);
        assertEq(usdc.balanceOf(address(lender)), 127_273);
    }

    function test_apply_template_and_withdraw_reserve() public {
        uint256 id = _openFunded(1);
        vm.startPrank(user);
        vaults.openAgent(id, 0, 1, 5_000, 4_000, 11_000);
        vaults.applyTemplate(id, 0);
        vm.stopPrank();
        EquinoxVaults.AgentState memory s = vaults.agentState(id);
        assertEq(s.risk, 0);
        assertEq(s.targetLtvBps, 4_000);
        assertEq(s.recycleRatioBps, 5_000);
        assertEq(s.minHfBps, 15_000);

        usdc.mint(address(this), 1_000_000);
        usdc.approve(address(vaults), 1_000_000);
        vaults.fundBuffer(id, 1_000_000);
        vm.prank(user);
        vaults.withdrawReserve(id, 400_000);
        assertEq(usdc.balanceOf(user), 400_000);
        (,,,, uint256 buffer,,) = vaults.vaults(id);
        assertEq(buffer, 600_000);
    }

    function test_shadow_credit_withdraw() public {
        ShadowPool shadow = new ShadowPool(reg, IERC20(address(usdc)));
        usdc.mint(agent, 300);
        vm.startPrank(agent);
        usdc.approve(address(shadow), 300);
        shadow.credit(user, 300);
        vm.stopPrank();
        assertEq(shadow.balanceOf(user), 300);

        vm.prank(user);
        shadow.withdraw(100);
        assertEq(usdc.balanceOf(user), 100);
        assertEq(shadow.balanceOf(user), 200);
    }

    function test_action_log_hash_chain() public {
        uint256 id = _openFunded(1);
        vm.prank(user);
        vaults.openAgent(id, 1, 1, 5_500, 7_000, 13_000);
        vm.prank(agent);
        vaults.recordAction(id, 3, keccak256("payload"));
        EquinoxVaults.AgentState memory s = vaults.agentState(id);
        assertEq(s.actionCount, 1);
        assertEq(s.logHead, keccak256(abi.encodePacked(bytes32(0), uint8(3), keccak256("payload"), uint64(block.timestamp))));
    }

    function test_chainlink_refresh_normalizes() public {
        MockERC20 t = new MockERC20("X", "X", 18);
        MockFeed feed = new MockFeed(18, 650e18); // $650 with 18 decimals
        reg.registerAsset(address(t), 5_000, 7_000, 18, address(feed));
        oracle.refreshFromChainlink(address(t), 3600);
        assertEq(oracle.priceOf(address(t), 60), 650e8);
        assertEq(oracle.normalize(200, 2), 200_000_000);
        assertEq(oracle.normalize(12_345_000_000, 10), 123_450_000);
    }

    function test_RevertWhen_oracle_price_stale() public {
        vm.warp(block.timestamp + 120);
        vm.expectRevert(PriceOracle.Stale.selector);
        oracle.priceOf(address(usdc), 60);
    }

    function test_RevertWhen_skim_paused() public {
        _fundLender(5_000_000);
        uint256 id = _openFunded(1_000_000_000);
        vm.prank(user);
        vaults.openAgent(id, 2, 1, 5_000, 4_000, 11_000);
        reg.setPaused(true);
        vm.prank(agent);
        vm.expectRevert(EquinoxRegistry.Paused.selector);
        vaults.skimToReserve(id, MAX_AGE);
    }

    function test_RevertWhen_withdraw_leaves_debt_unbacked() public {
        uint256 id = _openFunded(1_000e9); // 1_000 tWBNB (9 dp) @ $2
        vaults.setDebtForTesting(id, 1_000e6); // 1_000 tUSD (6 dp) // $1_000 debt vs $2_000 collateral @ 60% max LTV
        vm.startPrank(user);
        vaults.withdraw(id, 100e9); // $1_800 * 60% = $1_080 >= $1_000: ok
        vm.expectRevert(EquinoxVaults.Undercollateralized.selector);
        vaults.withdraw(id, 100e9); // $1_600 * 60% = $960 < $1_000
        vm.stopPrank();
    }

    function test_RevertWhen_withdraw_non_owner() public {
        uint256 id = _openFunded(100);
        vm.prank(makeAddr("mallory"));
        vm.expectRevert(EquinoxVaults.NotOwner.selector);
        vaults.withdraw(id, 10);
    }

    function test_RevertWhen_non_agent_enters_strategy() public {
        uint256 id = _openFunded(1_000);
        vm.prank(user);
        vm.expectRevert(EquinoxVaults.NotAgent.selector);
        vaults.enterStrategy(id, "native-wbnb", 600, 600);
    }
}
