// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title IdentityRegistry
/// @notice Minimal ERC-8004 IdentityRegistry. Each agent is an ERC-721 NFT
///         where tokenId = agentId, tokenURI = agentURI (resolves to the
///         agent's JSON registration file). Per-agent string→bytes metadata
///         is stored on-chain, with `agentWallet` as a reserved key.
/// @dev    This is a minimal implementation for the BridgeAgent hackathon build
///         hackathon. The Reputation and Validation registries from EIP-8004
///         are intentionally out of scope — they are separate contracts in
///         the spec and are not required for the agent-identity demo.
contract IdentityRegistry is ERC721URIStorage {
    struct MetadataEntry {
        string key;
        bytes value;
    }

    error NotAgentOwner();
    error EmptyAgentURI();

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);
    event AgentURIUpdated(uint256 indexed agentId, string newURI);
    event MetadataSet(uint256 indexed agentId, string indexed key, bytes value);

    uint256 private _nextAgentId = 1;

    /// @dev mapping agentId → metadataKey → value
    mapping(uint256 => mapping(string => bytes)) private _metadata;

    constructor() ERC721("Bridgeagent Identity", "BRIDGE-AGENT") {}

    /// @notice Mint a new agent identity NFT to `msg.sender`.
    /// @param agentURI HTTP(S) or IPFS URI resolving to the agent's JSON registration file.
    /// @param metadata Optional initial metadata entries set in the same tx.
    function register(string calldata agentURI, MetadataEntry[] calldata metadata)
        external
        returns (uint256 agentId)
    {
        if (bytes(agentURI).length == 0) revert EmptyAgentURI();

        agentId = _nextAgentId++;
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        for (uint256 i = 0; i < metadata.length; i++) {
            _metadata[agentId][metadata[i].key] = metadata[i].value;
            emit MetadataSet(agentId, metadata[i].key, metadata[i].value);
        }

        emit AgentRegistered(agentId, msg.sender, agentURI);
    }

    /// @notice Update the agent's resolution URI. Owner-only.
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        if (ownerOf(agentId) != msg.sender) revert NotAgentOwner();
        if (bytes(newURI).length == 0) revert EmptyAgentURI();

        _setTokenURI(agentId, newURI);
        emit AgentURIUpdated(agentId, newURI);
    }

    /// @notice Set a single metadata entry. Owner-only.
    function setMetadata(uint256 agentId, string calldata key, bytes calldata value) external {
        if (ownerOf(agentId) != msg.sender) revert NotAgentOwner();

        _metadata[agentId][key] = value;
        emit MetadataSet(agentId, key, value);
    }

    /// @notice Read a metadata entry. Returns empty bytes if unset.
    function getMetadata(uint256 agentId, string calldata key)
        external
        view
        returns (bytes memory)
    {
        return _metadata[agentId][key];
    }

    /// @notice Total number of agents registered (also the next agentId - 1).
    function totalAgents() external view returns (uint256) {
        return _nextAgentId - 1;
    }
}
