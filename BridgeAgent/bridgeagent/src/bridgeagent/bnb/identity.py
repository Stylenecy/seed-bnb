"""ERC-8004 IdentityRegistry helper.

Wraps the deployed IdentityRegistry contract so the rest of bridgeagent
can register an agent and read its metadata without writing web3 boilerplate.

The IdentityRegistry NFT (tokenId == agentId) is owned by the configured
BNB_PRIVATE_KEY signer. TradeJournal.record() requires the caller to
own the agent NFT — so the same key that registers must also be the one
flushing trades.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Tuple

from bridgeagent.bnb.client import BnbClient

logger = logging.getLogger(__name__)


@dataclass
class MetadataEntry:
    key: str
    value: bytes


class IdentityClient:
    """High-level wrapper over IdentityRegistry."""

    def __init__(self, bnb: BnbClient):
        self.bnb = bnb
        self.contract = bnb.identity

    # ---- writes ----

    def register_agent(
        self,
        agent_uri: str,
        metadata: List[MetadataEntry] | None = None,
    ) -> int:
        """Mint a new agent identity NFT to the configured signer.

        Returns the assigned `agentId` (parsed from the AgentRegistered event).
        Blocks until the tx is mined.
        """
        if not agent_uri:
            raise ValueError("agent_uri must be non-empty")

        # Solidity expects MetadataEntry[] as a tuple of (string, bytes) tuples.
        meta_tuples: List[Tuple[str, bytes]] = [
            (m.key, m.value) for m in (metadata or [])
        ]

        fn = self.contract.functions.register(agent_uri, meta_tuples)
        tx_hash = self.bnb.send(fn)
        logger.info("register_agent tx submitted: %s", tx_hash)
        receipt = self.bnb.wait(tx_hash)

        # Parse AgentRegistered(agentId, owner, agentURI) from the receipt.
        # In web3.py 7.x, contract.events.AgentRegistered().process_receipt
        # returns matching events.
        events = self.contract.events.AgentRegistered().process_receipt(receipt)
        if not events:
            raise RuntimeError(
                f"register tx confirmed but no AgentRegistered event found "
                f"(tx={tx_hash}). Was the right address registered?"
            )
        agent_id = int(events[0]["args"]["agentId"])
        logger.info("Agent registered: id=%s owner=%s", agent_id, self.bnb.address)
        return agent_id

    def set_agent_uri(self, agent_id: int, new_uri: str) -> str:
        fn = self.contract.functions.setAgentURI(agent_id, new_uri)
        tx_hash = self.bnb.send(fn)
        self.bnb.wait(tx_hash)
        return tx_hash

    def set_metadata(self, agent_id: int, key: str, value: bytes) -> str:
        fn = self.contract.functions.setMetadata(agent_id, key, value)
        tx_hash = self.bnb.send(fn)
        self.bnb.wait(tx_hash)
        return tx_hash

    # ---- reads ----

    def get_agent_uri(self, agent_id: int) -> str:
        return self.contract.functions.tokenURI(agent_id).call()

    def get_metadata(self, agent_id: int, key: str) -> bytes:
        return self.contract.functions.getMetadata(agent_id, key).call()

    def owner_of(self, agent_id: int) -> str:
        return self.contract.functions.ownerOf(agent_id).call()

    def total_agents(self) -> int:
        return int(self.contract.functions.totalAgents().call())
