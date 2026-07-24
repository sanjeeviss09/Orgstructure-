from aira.graph.contracts.base import GraphRelationship
from aira.graph.pipeline.middlewares import GraphProcessingPipeline

class RelationshipManager:
    def __init__(self, pipeline: GraphProcessingPipeline):
        self.pipeline = pipeline

    async def link(self, rel: GraphRelationship) -> GraphRelationship:
        return await self.pipeline.execute_relationship(rel)

    async def unlink(self, rel_id: str) -> bool:
        # Simplification: in reality this delegates to pipeline for soft-delete.
        return True
