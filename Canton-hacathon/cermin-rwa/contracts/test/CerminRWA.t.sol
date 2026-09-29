// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {CerminRWA} from "../src/CerminRWA.sol";
import {MockToken} from "../src/MockToken.sol";
import {RwaPriceFeed} from "../src/RwaPriceFeed.sol";

/// Port of the Daml Script suites (CreditTests / GuardTests / CouponTests) on
/// the demo numbers: 10,000 mUST @ 1.00, 6,000 mUSD loan, trigger 130%,
/// target 145%, maxRepay 2,000, vault 1,500. Privacy tests (pool can't see
/// vault/policy/rescue) have no EVM equivalent and are intentionally dropped.
contract CerminRWATest is Test {
    bytes32 constant INSTRUMENT = "mUST-2030";

    address issuer = makeAddr("issuer");
    address pool = makeAddr("pool");
    address oracle = makeAddr("oracle");
    address guard = makeAddr("guard");
    address borrower = makeAddr("borrower");
    address stranger = makeAddr("stranger");

    MockToken must;
    MockToken musd;
    RwaPriceFeed feed;
    CerminRWA rwa;

    function setUp() public {
        must = new MockToken("Mock US Treasury 2030", "mUST", issuer);
        musd = new MockToken("Mock USD", "mUSD", issuer);
        feed = new RwaPriceFeed(oracle);
        rwa = new CerminRWA(
            address(must), address(musd), address(feed), INSTRUMENT, 450, uint64(1_900_000_000), issuer, pool
        );
        vm.prank(oracle);
        feed.updatePrice(INSTRUMENT, 1e18);

        vm.startPrank(issuer);
        must.mint(borrower, 20_000e18);
        musd.mint(pool, 1_000_000e18);
        musd.mint(issuer, 10_000e18);
        musd.approve(address(rwa), type(uint256).max);
        vm.stopPrank();

        vm.prank(pool);
        musd.approve(address(rwa), type(uint256).max);
        vm.startPrank(borrower);
        must.approve(address(rwa), type(uint256).max);
        musd.approve(address(rwa), type(uint256).max);
        vm.stopPrank();
    }

    function _originate(uint256 vaultDeposit, bool couponSweep) internal {
        vm.prank(pool);
        rwa.createOffer(borrower, guard, "loan-1", 6_000e18, 500, 10_000e18);
        vm.startPrank(borrower);
        rwa.acceptOffer();
        rwa.setGuardPolicy(guard, 13_000, 14_500, 2_000e18, couponSweep);
        rwa.openShadowVault(guard, vaultDeposit);
        vm.stopPrank();
    }

    function _setPrice(uint256 p) internal {
        vm.prank(oracle);
        feed.updatePrice(INSTRUMENT, p);
    }

    function _outstanding() internal view returns (uint256 o) {
        (,, o,,,,) = rwa.loans(borrower);
    }

    function _vaultBalance() internal view returns (uint256 b) {
        (, b,) = rwa.vaults(borrower);
    }

    // ── Credit ───────────────────────────────────────────────────────────────

    function test_borrowLifecycle() public {
        _originate(1_500e18, false);
        assertEq(must.balanceOf(address(rwa)), 10_000e18, "collateral escrowed");
        assertEq(musd.balanceOf(borrower), 6_000e18 - 1_500e18, "principal disbursed minus vault deposit");
        assertEq(rwa.currentHealthRatioBps(borrower), 16_667);
    }

    function test_manualRepayAndClose() public {
        _originate(0, false);
        vm.startPrank(borrower);
        rwa.repay(6_000e18);
        rwa.closeLoan();
        vm.stopPrank();
        assertEq(must.balanceOf(borrower), 20_000e18, "collateral released");
    }

    function test_cannotRepayMoreThanOutstanding() public {
        _originate(0, false);
        vm.prank(borrower);
        vm.expectRevert(CerminRWA.ExceedsOutstanding.selector);
        rwa.repay(6_001e18);
    }

    function test_topUpCollateral() public {
        _originate(0, false);
        vm.prank(borrower);
        rwa.topUpCollateral(2_000e18);
        assertEq(rwa.currentHealthRatioBps(borrower), 20_000);
    }

    // ── Guard ────────────────────────────────────────────────────────────────

    function test_guardRepayRestoresHealth() public {
        _originate(1_500e18, false);
        _setPrice(0.76e18);
        assertEq(rwa.currentHealthRatioBps(borrower), 12_667);

        uint256 poolBefore = musd.balanceOf(pool);
        vm.prank(guard);
        uint256 repaid = rwa.guardRepay(borrower);

        assertApproxEqAbs(_outstanding(), 5_241.38e18, 0.01e18);
        assertEq(rwa.currentHealthRatioBps(borrower), 14_500);
        assertEq(musd.balanceOf(pool) - poolBefore, repaid, "pool received the repayment");
        assertEq(_vaultBalance(), 1_500e18 - repaid);
        CerminRWA.RescueEvent[] memory evs = rwa.getRescueEvents(borrower);
        assertEq(evs.length, 1);
        assertEq(evs[0].healthBefore, 12_667);
        assertEq(evs[0].healthAfter, 14_500);
    }

    function test_guardRepayRefusedWhenHealthy() public {
        _originate(1_500e18, false);
        vm.prank(guard);
        vm.expectRevert(CerminRWA.HealthyLoan.selector);
        rwa.guardRepay(borrower);
    }

    function test_guardRepayOnlyByGuardAgent() public {
        _originate(1_500e18, false);
        _setPrice(0.76e18);
        vm.prank(stranger);
        vm.expectRevert(CerminRWA.NotGuardAgent.selector);
        rwa.guardRepay(borrower);
    }

    function test_guardRepayCappedByMaxRepayPerEvent() public {
        _originate(5_000e18, false);
        _setPrice(0.5e18); // needed ~2551 > maxRepay 2000
        vm.prank(guard);
        assertEq(rwa.guardRepay(borrower), 2_000e18);
    }

    function test_guardRepayCappedByBalance() public {
        _originate(300e18, false);
        _setPrice(0.76e18);
        vm.prank(guard);
        assertEq(rwa.guardRepay(borrower), 300e18);
        assertEq(_vaultBalance(), 0);
    }

    function test_vaultTopUpWithdraw() public {
        _originate(1_500e18, false);
        vm.startPrank(borrower);
        rwa.topUpVault(500e18);
        rwa.withdrawVault(1_000e18);
        vm.expectRevert(CerminRWA.ExceedsBalance.selector);
        rwa.withdrawVault(1_001e18);
        vm.stopPrank();
        assertEq(_vaultBalance(), 1_000e18);
    }

    function test_emptyVaultGraceAndLastResortDefault() public {
        _originate(0, false);
        _setPrice(0.76e18);
        vm.prank(guard);
        rwa.startGracePeriod(borrower);

        vm.prank(pool);
        vm.expectRevert(CerminRWA.GraceNotExpired.selector);
        rwa.lastResortDefault(borrower);

        vm.warp(block.timestamp + 72 hours + 1);
        vm.prank(pool);
        rwa.lastResortDefault(borrower);
        assertEq(must.balanceOf(pool), 10_000e18);
    }

    function test_graceRefusedWhenVaultSufficient() public {
        _originate(1_500e18, false);
        _setPrice(0.76e18);
        vm.prank(guard);
        vm.expectRevert(CerminRWA.VaultSufficient.selector);
        rwa.startGracePeriod(borrower);
    }

    // ── Coupon ───────────────────────────────────────────────────────────────

    function test_couponSweepShrinksLoan() public {
        _originate(1_500e18, true);
        _setPrice(0.76e18);
        vm.prank(guard);
        rwa.guardRepay(borrower);

        vm.prank(issuer);
        uint256 id = rwa.payCoupon(borrower, guard, 10_000e18);
        vm.prank(guard);
        rwa.sweepToLoan(id);

        assertApproxEqAbs(_outstanding(), 5_128.88e18, 0.01e18);
        assertEq(rwa.currentHealthRatioBps(borrower), 14_818);
        assertEq(rwa.getRescueEvents(borrower).length, 2);
        assertEq(rwa.activeCouponIds().length, 0);
    }

    function test_couponSweepOffPaysStableCoin() public {
        _originate(0, false);
        vm.prank(issuer);
        uint256 id = rwa.payCoupon(borrower, guard, 10_000e18);

        vm.prank(guard);
        vm.expectRevert(CerminRWA.CouponSweepDisabled.selector);
        rwa.sweepToLoan(id);

        uint256 before = musd.balanceOf(borrower);
        vm.prank(borrower);
        rwa.claimCoupon(id);
        assertEq(musd.balanceOf(borrower) - before, 112.5e18);
    }

    function test_guardAgentCannotSweepWithMismatchedPolicy() public {
        _originate(0, true);
        vm.prank(issuer);
        uint256 id = rwa.payCoupon(borrower, stranger, 10_000e18);
        vm.prank(stranger);
        vm.expectRevert(CerminRWA.NotGuardAgent.selector);
        rwa.sweepToLoan(id);
    }
}
