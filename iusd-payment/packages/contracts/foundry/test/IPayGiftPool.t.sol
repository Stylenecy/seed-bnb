// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPayGiftPool} from "../src/IPayGiftPool.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract IPayGiftPoolTest is Test {
    MockERC20 usdt;
    IPayGiftPool pool;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address relayer = makeAddr("relayer");
    address treasury = makeAddr("treasury");

    bytes claimKey = hex"deadbeef";

    function setUp() public {
        usdt = new MockERC20("Mock USDT", "USDT");
        pool = new IPayGiftPool(IERC20(address(usdt)));
        pool.setTreasury(treasury);
        pool.addSponsor(relayer);
        string[] memory urls = new string[](1);
        urls[0] = "https://example.com/box.png";
        pool.registerBox(1, "Flexible", 0, 100, urls, true); // 1% fee
        pool.registerBox(2, "Fixed 5", 5e18, 0, urls, true);
        usdt.mint(alice, 10_000e18);
        vm.prank(alice);
        usdt.approve(address(pool), type(uint256).max);
    }

    function _slotSecret(uint64 i) internal view returns (bytes memory) {
        // slot_secret = sha256(claim_key || le_bytes(i))
        return abi.encodePacked(sha256(abi.encodePacked(claimKey, _le(i))));
    }

    function _le(uint64 v) internal pure returns (bytes8) {
        uint64 r;
        for (uint256 i = 0; i < 8; i++) r = (r << 8) | ((v >> (8 * i)) & 0xff);
        return bytes8(r);
    }

    function _proof(bytes memory secret, address who) internal pure returns (bytes memory) {
        return abi.encodePacked(sha256(abi.encodePacked(secret, bytes32(uint256(uint160(who))))));
    }

    function _hashes(uint64 n) internal view returns (bytes[] memory hs) {
        hs = new bytes[](n);
        for (uint64 i = 0; i < n; i++) hs[i] = abi.encodePacked(sha256(_slotSecret(i)));
    }

    function test_direct_gift_claim() public {
        bytes memory ckh = abi.encodePacked(sha256(claimKey));
        vm.prank(alice);
        pool.sendGift(1, hex"01", hex"c0ffee", ckh, 10e18, 0);
        assertEq(usdt.balanceOf(treasury), 0.1e18);
        vm.prank(bob);
        pool.claimDirect(hex"01", claimKey);
        assertEq(usdt.balanceOf(bob), 10e18);
    }

    function test_fixed_box_ignores_amount() public {
        bytes memory ckh = abi.encodePacked(sha256(claimKey));
        vm.prank(alice);
        pool.sendGift(2, hex"02", "", ckh, 999e18, 0);
        (,,,,, uint256 amount,,,,,,) = pool.getPacket(hex"02");
        assertEq(amount, 5e18);
    }

    function test_group_random_claims_sum_to_total() public {
        uint64 n = 5;
        bytes[] memory hs = _hashes(n);
        vm.prank(alice);
        pool.sendGiftGroup(1, hex"03", n, 50e18, hex"0102030405060708", hs, 0);
        uint256 got;
        for (uint64 i = 0; i < n; i++) {
            address who = address(uint160(1000 + i));
            bytes memory s = _slotSecret(i);
            bytes memory pr = _proof(s, who);
            vm.prank(who);
            pool.claimSlot(hex"03", i, s, pr);
            got += usdt.balanceOf(who);
        }
        assertEq(got, 50e18);
        (,,,,,,,,, uint8 status,,) = pool.getPacket(hex"03");
        assertEq(status, 1);
    }

    function test_group_proof_bound_to_address() public {
        bytes[] memory hs = _hashes(2);
        vm.prank(alice);
        pool.sendGiftGroupEqual(1, hex"04", 2, 10e18, hs, 0);
        bytes memory s = _slotSecret(0);
        bytes memory bobProof = _proof(s, bob);
        vm.prank(carol); // front-runner reusing bob's proof
        vm.expectRevert(IPayGiftPool.InvalidProof.selector);
        pool.claimSlot(hex"04", 0, s, bobProof);
        vm.prank(bob);
        pool.claimSlot(hex"04", 0, s, bobProof);
        assertEq(usdt.balanceOf(bob), 5e18);
    }

    function test_sponsor_claim_slot() public {
        bytes[] memory hs = _hashes(2);
        vm.prank(alice);
        pool.sendGiftGroupEqual(1, hex"05", 2, 10e18, hs, 0);
        bytes memory s = _slotSecret(1);
        bytes memory pr = _proof(s, bob);
        vm.prank(relayer);
        pool.sponsorClaimSlot(hex"05", 1, s, pr, bob);
        assertEq(usdt.balanceOf(bob), 5e18);
    }

    function test_expire_and_refund() public {
        bytes[] memory hs = _hashes(4);
        vm.prank(alice);
        pool.sendGiftGroupEqual(1, hex"06", 4, 20e18, hs, 1 days);
        bytes memory s = _slotSecret(0);
        bytes memory pr = _proof(s, bob);
        vm.prank(bob);
        pool.claimSlot(hex"06", 0, s, pr);

        vm.prank(relayer);
        vm.expectRevert(IPayGiftPool.PacketNotExpired.selector);
        pool.expireAndRefund(hex"06");

        vm.warp(block.timestamp + 1 days + 1);
        uint256 before = usdt.balanceOf(alice);
        vm.prank(relayer);
        pool.expireAndRefund(hex"06");
        assertEq(usdt.balanceOf(alice), before + 15e18);
    }

    function test_disabled_box_reverts() public {
        pool.delistBox(1);
        bytes memory ckh = abi.encodePacked(sha256(claimKey));
        vm.prank(alice);
        vm.expectRevert(IPayGiftPool.BoxDisabled.selector);
        pool.sendGift(1, hex"07", "", ckh, 10e18, 0);
    }

    function test_remove_box_keeps_order() public {
        string[] memory urls = new string[](0);
        pool.registerBox(3, "Three", 0, 0, urls, true);
        pool.removeBox(2);
        uint64[] memory ids = pool.getBoxIds();
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 3);
    }
}
