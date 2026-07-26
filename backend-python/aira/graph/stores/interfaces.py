from typing import Protocol, List, Optional, Dict
from aira.graph.contracts.base import GraphNode, GraphRelationship

class IGraphStore(Protocol):
    async def create_node(self, node: GraphNode) -> GraphNode:
        ...
        
    async def update_node(self, node: GraphNode) -> GraphNode:
        ...
        
    async def get_node(self, node_id: str) -> Optional[GraphNode]:
        ...
        
    async def create_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        ...
        
    async def get_relationships(self, source_id: str, target_id: Optional[str] = None, rel_type: Optional[str] = None) -> List[GraphRelationship]:
        ...

    async def get_all_nodes(self) -> List[GraphNode]:
        ...
        
    async def get_all_relationships(self) -> List[GraphRelationship]:
        ...
