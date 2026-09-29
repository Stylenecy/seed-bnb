// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPayPool} from "../src/IPayPool.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract IPayPoolTest is Test {
    MockERC20 usdt;
    IPayPool pool;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address relayer = makeAddr("relayer");
    address treasury = makeAddr("treasury");

    bytes pid = hex"aabbcc";
    bytes claimKey = hex"1234567890";

    function setUp() public {
        usdt = new MockERC20("Mock USDT", "USDT");
        pool = new IPayPool(IERC20(address(usdt)), 50, 1e18); // 0.5%, cap 1 USDT
        pool.setTreasury(treasury);
        pool.addSponsor(relayer);
        usdt.mint(alice, 1000e18);
        vm.prank(alice);
        usdt.approve(address(pool), type(uint256).max);
    }

    function _deposit(uint256 amount) internal {
        bytes memory ckh = abi.encodePacked(sha256(claimKey));
        vm.prank(alice);
        pool.deposit(pid, amount, hex"01", hex"02", hex"03", ckh, 0);
    }

    function test_deposit_and_claim() public {
        _deposit(100e18);
        // fee = 0.5 USDT (< cap)
        assertEq(usdt.balanceOf(treasury), 0.5e18);
        (uint8 st, uint256 amt, address sender,,) = pool.getPayment(pid);
        assertEq(st, 2);
        assertEq(amt, 99.5e18);
        assertEq(sender, alice);

        vm.prank(bob);
        pool.claim(pid, claimKey);
        assertEq(usdt.balanceOf(bob), 99.5e18);
        (st,,,,) = pool.getPayment(pid);
        assertEq(st, 3);
    }

    function test_fee_cap() public {
        _deposit(1000e18);
        assertEq(usdt.balanceOf(treasury), 1e18);
    }

    function test_wrong_key_reverts() public {
        _deposit(10e18);
        vm.prank(bob);
        vm.expectRevert(IPayPool.InvalidKey.selector);
        pool.claim(pid, hex"00");
    }

    function test_sponsor_claim() public {
        _deposit(10e18);
        vm.prank(relayer);
        pool.sponsorClaim(pid, claimKey, bob);
        assertGt(usdt.balanceOf(bob), 0);
        vm.prank(bob);
        vm.expectRevert(IPayPool.NotSponsor.selector);
        pool.sponsorClaim(pid, claimKey, bob);
    }

    function test_revoke_only_sender() public {
        _deposit(10e18);
        vm.prank(bob);
        vm.expectRevert(IPayPool.NotSender.selector);
        pool.revoke(pid);
        uint256 before = usdt.balanceOf(alice);
        vm.prank(alice);
        pool.revoke(pid);
        assertEq(usdt.balanceOf(alice), before + 9.95e18);
    }

    function test_expire_after_ttl() public {
        _deposit(10e18);
        vm.expectRevert(IPayPool.PaymentNotExpired.selector);
        pool.expire(pid);
        vm.warp(block.timestamp + 30 days + 1);
        pool.expire(pid);
        (uint8 st,,,,) = pool.getPayment(pid);
        assertEq(st, 7);
    }

    function test_refund_by_claimer() public {
        _deposit(10e18);
        vm.prank(bob);
        pool.claim(pid, claimKey);
        vm.startPrank(bob);
        usdt.approve(address(pool), type(uint256).max);
        pool.refund(pid);
        vm.stopPrank();
        assertEq(usdt.balanceOf(bob), 0);
        (uint8 st,,,,) = pool.getPayment(pid);
        assertEq(st, 6);
    }

    function test_frozen_cannot_deposit() public {
        pool.freezeAddress(alice);
        bytes memory ckh = abi.encodePacked(sha256(claimKey));
        vm.prank(alice);
        vm.expectRevert(IPayPool.AccountFrozen.selector);
        pool.deposit(pid, 10e18, "", "", "", ckh, 0);
    }

    function test_amount_bounds() public {
        bytes memory ckh = abi.encodePacked(sha256(claimKey));
        vm.prank(alice);
        vm.expectRevert(IPayPool.InvalidAmount.selector);
        pool.deposit(pid, 0.01e18, "", "", "", ckh, 0);
    }

    function test_cannot_remove_original_owner() public {
        pool.addOwner(bob);
        vm.prank(bob);
        vm.expectRevert(IPayPool.NotAuthorized.selector);
        pool.removeOwner(address(this));
    }
}
