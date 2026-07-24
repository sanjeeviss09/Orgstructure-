from typing import Optional
from aira.graph.stores.interfaces import IGraphStore
from aira.graph.contracts.base import GraphRelationship
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("relationship_resolver")

class RelationshipResolver:
    """Resolves relationships to prevent duplicates."""
    def __init__(self, store: IGraphStore):
        self.store = store

    async def resolve(self, rel: GraphRelationship) -> GraphRelationship:
        existing_rels = await self.store.get_relationships(rel.source_id, rel.target_id, rel.type)
        if existing_rels:
            logger.info(f"RelationshipResolver: Relationship {rel.type} already exists between {rel.source_id} and {rel.target_id}. Resolving to Update.")
            existing = existing_rels[0]
            rel.rel_id = existing.rel_id
            rel.version = existing.version + 1
            rel.created_at = existing.created_at
        else:
            logger.info(f"RelationshipResolver: Relationship {rel.type} is new. Resolving to Create.")
        return rel
