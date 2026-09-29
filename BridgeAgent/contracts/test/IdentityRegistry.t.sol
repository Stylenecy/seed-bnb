// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry internal registry;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        registry = new IdentityRegistry();
    }

    function test_registerMintsNFT() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://alice", new IdentityRegistry.MetadataEntry[](0));

        assertEq(agentId, 1, "first agent gets id 1");
        assertEq(registry.ownerOf(agentId), alice, "alice owns the NFT");
        assertEq(registry.tokenURI(agentId), "ipfs://alice", "tokenURI matches agentURI");
        assertEq(registry.totalAgents(), 1, "totalAgents reflects mint");
    }

    function test_registerEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IdentityRegistry.AgentRegistered(1, alice, "ipfs://alice");
        registry.register("ipfs://alice", new IdentityRegistry.MetadataEntry[](0));
    }

    function test_registerRejectsEmptyURI() public {
        vm.prank(alice);
        vm.expectRevert(IdentityRegistry.EmptyAgentURI.selector);
        registry.register("", new IdentityRegistry.MetadataEntry[](0));
    }

    function test_registerWithMetadata() public {
        IdentityRegistry.MetadataEntry[] memory metadata = new IdentityRegistry.MetadataEntry[](2);
        metadata[0] = IdentityRegistry.MetadataEntry({key: "venue", value: bytes("hyperliquid")});
        metadata[1] = IdentityRegistry.MetadataEntry({key: "strategies", value: bytes("8")});

        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://alice", metadata);

        assertEq(registry.getMetadata(agentId, "venue"), bytes("hyperliquid"));
        assertEq(registry.getMetadata(agentId, "strategies"), bytes("8"));
        assertEq(registry.getMetadata(agentId, "missing"), bytes(""));
    }

    function test_setAgentURIOnlyOwner() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://v1", new IdentityRegistry.MetadataEntry[](0));

        vm.prank(bob);
        vm.expectRevert(IdentityRegistry.NotAgentOwner.selector);
        registry.setAgentURI(agentId, "ipfs://v2");

        vm.prank(alice);
        registry.setAgentURI(agentId, "ipfs://v2");
        assertEq(registry.tokenURI(agentId), "ipfs://v2");
    }

    function test_setMetadataOnlyOwner() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://alice", new IdentityRegistry.MetadataEntry[](0));

        vm.prank(bob);
        vm.expectRevert(IdentityRegistry.NotAgentOwner.selector);
        registry.setMetadata(agentId, "venue", bytes("hyperliquid"));

        vm.prank(alice);
        registry.setMetadata(agentId, "venue", bytes("hyperliquid"));
        assertEq(registry.getMetadata(agentId, "venue"), bytes("hyperliquid"));
    }

    function test_agentIdsIncrement() public {
        vm.prank(alice);
        uint256 a = registry.register("ipfs://alice", new IdentityRegistry.MetadataEntry[](0));
        vm.prank(bob);
        uint256 b = registry.register("ipfs://bob", new IdentityRegistry.MetadataEntry[](0));

        assertEq(a, 1);
        assertEq(b, 2);
        assertEq(registry.totalAgents(), 2);
    }
}
