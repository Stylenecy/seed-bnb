// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {TradeJournal} from "../src/TradeJournal.sol";

contract TradeJournalTest is Test {
    IdentityRegistry internal registry;
    TradeJournal internal journal;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    uint256 internal aliceAgentId;

    function setUp() public {
        registry = new IdentityRegistry();
        journal = new TradeJournal(registry);

        vm.prank(alice);
        aliceAgentId = registry.register(
            "ipfs://alice",
            new IdentityRegistry.MetadataEntry[](0)
        );
    }

    function test_recordAppendsTrade() public {
        bytes32 tradeHash = keccak256("trade-1");
        vm.prank(alice);
        journal.record(aliceAgentId, tradeHash, int256(450), uint64(block.timestamp));

        assertEq(journal.totalTrades(), 1);
        assertEq(journal.tradeCountByAgent(aliceAgentId), 1);

        TradeJournal.TradeRecord memory rec = journal.tradeAt(0);
        assertEq(rec.agentId, aliceAgentId);
        assertEq(rec.tradeHash, tradeHash);
        assertEq(rec.pnlBps, int256(450));
        assertEq(rec.closedAt, uint64(block.timestamp));
    }

    function test_recordEmitsEvent() public {
        bytes32 tradeHash = keccak256("trade-1");
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit TradeJournal.TradeRecorded(
            aliceAgentId,
            0,
            tradeHash,
            int256(-250),
            uint64(block.timestamp)
        );
        journal.record(aliceAgentId, tradeHash, int256(-250), uint64(block.timestamp));
    }

    function test_recordRejectsNonOwner() public {
        bytes32 tradeHash = keccak256("trade-1");
        vm.prank(bob);
        vm.expectRevert(TradeJournal.NotAgentOwner.selector);
        journal.record(aliceAgentId, tradeHash, int256(0), uint64(block.timestamp));
    }

    function test_recordRejectsEmptyHash() public {
        vm.prank(alice);
        vm.expectRevert(TradeJournal.EmptyHash.selector);
        journal.record(aliceAgentId, bytes32(0), int256(0), uint64(block.timestamp));
    }

    function test_paginationByAgent() public {
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            journal.record(
                aliceAgentId,
                keccak256(abi.encode(i)),
                int256(int256(i) * 100),
                uint64(block.timestamp + i)
            );
        }

        TradeJournal.TradeRecord[] memory page = journal.tradesByAgent(aliceAgentId, 0, 3);
        assertEq(page.length, 3);
        assertEq(page[0].pnlBps, int256(0));
        assertEq(page[1].pnlBps, int256(100));
        assertEq(page[2].pnlBps, int256(200));

        TradeJournal.TradeRecord[] memory page2 = journal.tradesByAgent(aliceAgentId, 3, 3);
        assertEq(page2.length, 2, "limit clipped to remaining");
        assertEq(page2[0].pnlBps, int256(300));
        assertEq(page2[1].pnlBps, int256(400));

        TradeJournal.TradeRecord[] memory pageOOB = journal.tradesByAgent(aliceAgentId, 99, 3);
        assertEq(pageOOB.length, 0, "offset past end returns empty");
    }

    function test_separateAgentsHaveSeparateLogs() public {
        vm.prank(bob);
        uint256 bobAgentId = registry.register(
            "ipfs://bob",
            new IdentityRegistry.MetadataEntry[](0)
        );

        vm.prank(alice);
        journal.record(aliceAgentId, keccak256("a"), int256(10), uint64(block.timestamp));
        vm.prank(bob);
        journal.record(bobAgentId, keccak256("b"), int256(20), uint64(block.timestamp));
        vm.prank(alice);
        journal.record(aliceAgentId, keccak256("c"), int256(30), uint64(block.timestamp));

        assertEq(journal.totalTrades(), 3);
        assertEq(journal.tradeCountByAgent(aliceAgentId), 2);
        assertEq(journal.tradeCountByAgent(bobAgentId), 1);
    }
}
