import networkx as nx
from typing import List, Optional, Dict
from aira.graph.stores.interfaces import IGraphStore
from aira.graph.contracts.base import GraphNode, GraphRelationship

class NetworkXGraphStore(IGraphStore):
    """
    In-memory graph store using NetworkX. Perfect for Phase 3 evaluation.
    """
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self._nodes_db: Dict[str, GraphNode] = {}
        self._rels_db: Dict[str, GraphRelationship] = {}

    async def create_node(self, node: GraphNode) -> GraphNode:
        self.graph.add_node(node.node_id, **node.model_dump())
        self._nodes_db[node.node_id] = node
        return node

    async def update_node(self, node: GraphNode) -> GraphNode:
        if node.node_id in self.graph:
            self.graph.nodes[node.node_id].update(node.model_dump())
            self._nodes_db[node.node_id] = node
        return node

    async def get_node(self, node_id: str) -> Optional[GraphNode]:
        return self._nodes_db.get(node_id)

    async def create_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        self.graph.add_edge(rel.source_id, rel.target_id, key=rel.rel_id, **rel.model_dump())
        self._rels_db[rel.rel_id] = rel
        return rel

    async def get_relationships(self, source_id: str, target_id: Optional[str] = None, rel_type: Optional[str] = None) -> List[GraphRelationship]:
        rels = []
        if source_id in self.graph:
            for tgt, edges in self.graph[source_id].items():
                if target_id and tgt != target_id:
                    continue
                for edge_key, edge_data in edges.items():
                    if rel_type and edge_data.get("type") != rel_type:
                        continue
                    if edge_key in self._rels_db:
                        rels.append(self._rels_db[edge_key])
        return rels

    async def get_all_nodes(self) -> List[GraphNode]:
        return list(self._nodes_db.values())

    async def get_all_relationships(self) -> List[GraphRelationship]:
        return list(self._rels_db.values())
