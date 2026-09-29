// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LanceHub } from "../src/LanceHub.sol";
import { LanceHubProxy } from "../src/LanceHubProxy.sol";

contract MockCELO is ERC20 {
    constructor() ERC20("Celo", "CELO") { }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract LanceHubTest is Test {
    LanceHub hub;
    MockCELO celo;
    address owner = makeAddr("owner");
    address seeder = makeAddr("seeder");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address rewarder = makeAddr("rewarder");

    uint16 constant FEE = 100; // 1%
    uint256 constant RATE = 1000; // 1 CELO -> 1000 LANCE

    function _deploy() internal returns (LanceHub h) {
        MockCELO c = new MockCELO();
        celo = c;
        LanceHub impl = new LanceHub();
        bytes memory init = abi.encodeCall(LanceHub.initialize, (IERC20(address(c)), owner, FEE));
        h = LanceHub(address(new LanceHubProxy(address(impl), init)));
    }

    function setUp() public {
        hub = _deploy();
        // seed 10 CELO -> 10,000 LANCE (sets NAV = 0.001 CELO/LANCE)
        _fund(seeder);
        vm.prank(seeder);
        hub.seed(10 ether);
        _fund(alice);
        _fund(bob);
        _fund(rewarder);
    }

    function _fund(address a) internal {
        celo.mint(a, 1_000 ether);
        vm.prank(a);
        celo.approve(address(hub), type(uint256).max);
    }

    function _deposit(address a, uint256 amount) internal returns (uint256 shares) {
        vm.prank(a);
        shares = hub.deposit(amount, a);
    }

    // ── metadata ──
    function test_metadata() public view {
        assertEq(hub.name(), "Lance");
        assertEq(hub.symbol(), "LANCE");
        assertEq(hub.decimals(), 18);
        assertEq(address(hub.asset()), address(celo));
        assertEq(hub.owner(), owner);
        assertEq(hub.redeemFeeBps(), FEE);
        assertTrue(hub.seeded());
    }

    // ── seed sets the cheap rate: 1 CELO ≈ 1000 LANCE, NAV ≈ 0.001 ──
    function test_seed_sets_cheap_rate() public view {
        assertEq(hub.balanceOf(seeder), 10 ether * RATE); // 10,000 LANCE
        assertApproxEqRel(hub.nav(), 0.001 ether, 1e12); // 0.001 CELO per LANCE
    }

    function test_seed_only_once() public {
        vm.prank(seeder);
        vm.expectRevert(LanceHub.AlreadySeeded.selector);
        hub.seed(1 ether);
    }

    function test_deposit_reverts_before_seed() public {
        LanceHub fresh = _deploy(); // not seeded
        celo.mint(alice, 10 ether);
        vm.startPrank(alice);
        celo.approve(address(fresh), type(uint256).max);
        vm.expectRevert(LanceHub.NotSeeded.selector);
        fresh.deposit(1 ether, alice);
        vm.stopPrank();
    }

    // ── deposit mints at the cheap NAV: 100 CELO -> ~100,000 LANCE ──
    function test_deposit_mints_at_nav() public {
        uint256 shares = _deposit(alice, 100 ether);
        assertApproxEqRel(shares, 100 ether * RATE, 1e12); // ~100,000 LANCE
        assertApproxEqRel(hub.nav(), 0.001 ether, 1e12);
    }

    // ── fundPool adds backing WITHOUT minting → NAV rises for holders ──
    function test_fundPool_raises_nav() public {
        _deposit(alice, 100 ether);
        uint256 navBefore = hub.nav();
        uint256 supplyBefore = hub.totalSupply();
        vm.prank(rewarder);
        hub.fundPool(50 ether);
        assertGt(hub.nav(), navBefore);
        assertEq(hub.totalSupply(), supplyBefore); // supply unchanged
    }

    // ── redeem fee stays in the pool → lifts NAV for those who remain ──
    function test_redeem_fee_stays_and_lifts_nav() public {
        uint256 aShares = _deposit(alice, 100 ether);
        _deposit(bob, 100 ether);
        uint256 navBefore = hub.nav();

        uint256 celoBefore = celo.balanceOf(alice);
        vm.prank(alice);
        uint256 got = hub.redeem(aShares, alice, alice);
        // ~100 CELO gross − 1% = ~99 CELO net
        assertApproxEqRel(got, 99 ether, 1e12);
        assertEq(celo.balanceOf(alice) - celoBefore, got);
        assertGt(hub.nav(), navBefore); // retained fee lifted NAV
    }

    // ── "Earn" = deposit on behalf: rewarder funds it, NAV stays neutral ──
    function test_earn_is_nav_neutral() public {
        _deposit(alice, 100 ether);
        uint256 navBefore = hub.nav();
        vm.prank(rewarder);
        uint256 earned = hub.deposit(20 ether, bob); // reward bob, backed by rewarder's CELO
        assertGt(earned, 0);
        assertApproxEqRel(hub.nav(), navBefore, 1e12);
        assertEq(hub.balanceOf(bob), earned);
    }

    // ── withdraw(assets) burns enough shares to cover the fee ──
    function test_withdraw_net_amount() public {
        _deposit(alice, 100 ether);
        uint256 sharesBefore = hub.balanceOf(alice);
        vm.prank(alice);
        uint256 sharesBurned = hub.withdraw(49.5 ether, alice, alice); // want 49.5 CELO net
        assertEq(celo.balanceOf(alice), 1_000 ether - 100 ether + 49.5 ether);
        // ~50 CELO gross / 0.001 NAV = ~50,000 LANCE burned
        assertApproxEqRel(sharesBurned, 50_000 ether, 1e12);
        assertEq(hub.balanceOf(alice), sharesBefore - sharesBurned);
    }

    // ── admin / guards ──
    function test_setRedeemFee_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        hub.setRedeemFee(200);
        vm.prank(owner);
        hub.setRedeemFee(200);
        assertEq(hub.redeemFeeBps(), 200);
    }

    function test_setRedeemFee_capped() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(LanceHub.FeeTooHigh.selector, uint16(501)));
        hub.setRedeemFee(501);
    }

    function test_pause_blocks_deposit_not_transfer() public {
        uint256 shares = _deposit(alice, 100 ether);
        vm.prank(owner);
        hub.pause();

        vm.prank(bob);
        vm.expectRevert();
        hub.deposit(10 ether, bob);

        vm.prank(alice);
        hub.transfer(bob, shares); // transfers stay live while paused
        assertEq(hub.balanceOf(bob), shares);

        vm.prank(owner);
        hub.unpause();
        _deposit(bob, 10 ether);
    }

    function test_upgrade_onlyOwner() public {
        LanceHub impl2 = new LanceHub();
        vm.prank(alice);
        vm.expectRevert();
        hub.upgradeToAndCall(address(impl2), "");
        vm.prank(owner);
        hub.upgradeToAndCall(address(impl2), "");
    }
}
