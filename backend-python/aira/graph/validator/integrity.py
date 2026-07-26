from aira.graph.contracts.base import GraphRelationship
from aira.graph.stores.interfaces import IGraphStore
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("graph_validator")

class GraphValidator:
    def __init__(self, store: IGraphStore):
        self.store = store

    async def validate_relationship(self, rel: GraphRelationship) -> bool:
        """Validates that a relationship does not reference orphan nodes or create a basic cycle."""
        source = await self.store.get_node(rel.source_id)
        target = await self.store.get_node(rel.target_id)
        
        if not source:
            logger.error(f"GraphValidator: Orphan source node {rel.source_id}")
            raise ValueError(f"Source node {rel.source_id} does not exist in graph.")
            
        if not target:
            logger.error(f"GraphValidator: Orphan target node {rel.target_id}")
            raise ValueError(f"Target node {rel.target_id} does not exist in graph.")
            
        if rel.source_id == rel.target_id:
            logger.error(f"GraphValidator: Circular hierarchy detected for node {rel.source_id}")
            raise ValueError("A node cannot have a relationship with itself.")
            
        return True
