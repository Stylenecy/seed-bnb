// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @title TradeJournal
/// @notice Append-only on-chain log of settled trades by ERC-8004 agents.
///         Each record anchors a trade by hash; the full trade detail lives
///         off-chain (resolved via the agent's URI or a separate endpoint).
///         Authorization: only the wallet that owns the agent's
///         IdentityRegistry NFT can post for that agentId.
contract TradeJournal {
    struct TradeRecord {
        uint256 agentId;
        bytes32 tradeHash;
        int256 pnlBps; // signed; 1bp = 0.01%
        uint64 closedAt; // unix timestamp
    }

    error NotAgentOwner();
    error EmptyHash();

    event TradeRecorded(
        uint256 indexed agentId,
        uint256 indexed index,
        bytes32 tradeHash,
        int256 pnlBps,
        uint64 closedAt
    );

    IdentityRegistry public immutable identity;

    /// @dev global append-only ledger of all trades from all agents.
    TradeRecord[] private _trades;

    /// @dev per-agent index into _trades. Lets clients scan by agent without
    ///      replaying every event.
    mapping(uint256 => uint256[]) private _byAgent;

    constructor(IdentityRegistry _identity) {
        identity = _identity;
    }

    /// @notice Append a trade record for `agentId`. Caller must own the
    ///         agent's IdentityRegistry NFT.
    function record(uint256 agentId, bytes32 tradeHash, int256 pnlBps, uint64 closedAt) external {
        if (identity.ownerOf(agentId) != msg.sender) revert NotAgentOwner();
        if (tradeHash == bytes32(0)) revert EmptyHash();

        uint256 index = _trades.length;
        _trades.push(TradeRecord({
            agentId: agentId,
            tradeHash: tradeHash,
            pnlBps: pnlBps,
            closedAt: closedAt
        }));
        _byAgent[agentId].push(index);

        emit TradeRecorded(agentId, index, tradeHash, pnlBps, closedAt);
    }

    function totalTrades() external view returns (uint256) {
        return _trades.length;
    }

    function tradeCountByAgent(uint256 agentId) external view returns (uint256) {
        return _byAgent[agentId].length;
    }

    /// @notice Read a single trade by its global index.
    function tradeAt(uint256 index) external view returns (TradeRecord memory) {
        return _trades[index];
    }

    /// @notice Page through an agent's trades. `offset` is into _byAgent[agentId];
    ///         pass 0 to start from the beginning. Returns at most `limit` records.
    function tradesByAgent(uint256 agentId, uint256 offset, uint256 limit)
        external
        view
        returns (TradeRecord[] memory page)
    {
        uint256[] storage indices = _byAgent[agentId];
        uint256 total = indices.length;

        if (offset >= total) {
            return new TradeRecord[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 size = end - offset;

        page = new TradeRecord[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = _trades[indices[offset + i]];
        }
    }
}
