from aira.graph.contracts.base import GraphNode
from aira.graph.pipeline.middlewares import GraphProcessingPipeline

class NodeManager:
    def __init__(self, pipeline: GraphProcessingPipeline):
        self.pipeline = pipeline

    async def create(self, node: GraphNode) -> GraphNode:
        return await self.pipeline.execute_node(node)

    async def update(self, node: GraphNode) -> GraphNode:
        return await self.pipeline.execute_node(node)
