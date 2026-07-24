from typing import Protocol, List
from aira.graph.contracts.base import GraphNode, GraphRelationship
from aira.graph.resolver.nodes import NodeResolver
from aira.graph.resolver.relationships import RelationshipResolver
from aira.graph.validator.integrity import GraphValidator
from aira.graph.stores.interfaces import IGraphStore
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("graph_pipeline")

class IGraphMiddleware(Protocol):
    async def process_node(self, node: GraphNode) -> GraphNode:
        ...
    async def process_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        ...

class ResolvingMiddleware(IGraphMiddleware):
    def __init__(self, node_resolver: NodeResolver, rel_resolver: RelationshipResolver):
        self.node_resolver = node_resolver
        self.rel_resolver = rel_resolver

    async def process_node(self, node: GraphNode) -> GraphNode:
        return await self.node_resolver.resolve(node)

    async def process_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        return await self.rel_resolver.resolve(rel)

class ValidationMiddleware(IGraphMiddleware):
    def __init__(self, validator: GraphValidator):
        self.validator = validator

    async def process_node(self, node: GraphNode) -> GraphNode:
        return node  # Node structure validated via Pydantic

    async def process_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        await self.validator.validate_relationship(rel)
        return rel

class StorageMiddleware(IGraphMiddleware):
    def __init__(self, store: IGraphStore):
        self.store = store

    async def process_node(self, node: GraphNode) -> GraphNode:
        if node.version > 1:
            return await self.store.update_node(node)
        return await self.store.create_node(node)

    async def process_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        return await self.store.create_relationship(rel)

class GraphProcessingPipeline:
    def __init__(self, middlewares: List[IGraphMiddleware]):
        self.middlewares = middlewares

    async def execute_node(self, node: GraphNode) -> GraphNode:
        logger.info(f"Executing Graph Pipeline for Node {node.node_id}")
        current = node
        for mw in self.middlewares:
            current = await mw.process_node(current)
        return current

    async def execute_relationship(self, rel: GraphRelationship) -> GraphRelationship:
        logger.info(f"Executing Graph Pipeline for Relationship {rel.type}")
        current = rel
        for mw in self.middlewares:
            current = await mw.process_relationship(current)
        return current
