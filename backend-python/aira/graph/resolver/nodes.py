from typing import Optional
from aira.graph.stores.interfaces import IGraphStore
from aira.graph.contracts.base import GraphNode
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("node_resolver")

class NodeResolver:
    """Resolves nodes to prevent duplicates by looking up an existing node ID."""
    def __init__(self, store: IGraphStore):
        self.store = store

    async def resolve(self, node: GraphNode) -> GraphNode:
        # Check if node already exists by ID
        existing_node = await self.store.get_node(node.node_id)
        if existing_node:
            logger.info(f"NodeResolver: Node {node.node_id} already exists. Resolving to Update.")
            # Merging logic can be complex, for now we overwrite properties and bump version
            node.version = existing_node.version + 1
            node.created_at = existing_node.created_at
        else:
            logger.info(f"NodeResolver: Node {node.node_id} is new. Resolving to Create.")
        return node
