from typing import List
from aira.graph.contracts.base import GraphNode, GraphRelationship
from aira.graph.stores.interfaces import IGraphStore

class QueryManager:
    def __init__(self, store: IGraphStore):
        self.store = store

    async def traverse(self, start_node_id: str, hops: int = 1) -> List[GraphNode]:
        # Minimal mock traversal, realistically we delegate to store implementation
        rels = await self.store.get_relationships(start_node_id)
        targets = []
        for r in rels:
            tgt = await self.store.get_node(r.target_id)
            if tgt:
                targets.append(tgt)
        return targets
