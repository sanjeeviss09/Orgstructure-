from typing import Optional, List, TypeVar, Type
from aira.memory.core.contracts import BaseMemoryContract
from aira.memory.store.interfaces import IMemoryStore
from aira.memory.pipeline.middlewares import MemoryProcessingPipeline
from aira.memory.ranking.retrieval_strategy import RetrievalStrategy
from aira.events.publisher import EventPublisher
from aira.contracts.events import BaseEvent
import uuid

T = TypeVar("T", bound=BaseMemoryContract)

class MemoryManager:
    """
    The Memory SDK. This is the only API future phases will use to interact with memory.
    """
    def __init__(self, store: IMemoryStore, pipeline: MemoryProcessingPipeline):
        self.store = store
        self.pipeline = pipeline

    async def save(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        # Pushes through validation, classification, storage, indexing, events
        saved_memory = await self.pipeline.execute(memory)
        
        # Specific event publishing based on memory type could happen in pipeline or here
        EventPublisher.publish(BaseEvent(
            event_id=str(uuid.uuid4()),
            request_id="internal",
            event_type=f"{memory.__class__.__name__}Created",
            payload={"memory_id": saved_memory.memory_id}
        ))
        
        return saved_memory

    async def retrieve(self, memory_id: str, as_type: Type[T]) -> Optional[T]:
        memory = await self.store.retrieve(memory_id)
        if memory and isinstance(memory, as_type):
            return memory
        return None

    async def search(self, tenant_id: str, context_filter: dict) -> List[BaseMemoryContract]:
        # For mock, we dont have a real search index. Imagine fetching from VectorDB/Elasticsearch here.
        # We would then rank it:
        # results = await self.store.search(...)
        # return RetrievalStrategy.score_and_rank(results, context_filter)
        pass

    async def promote(self, memory_id: str, new_category: str) -> bool:
        memory = await self.store.retrieve(memory_id)
        if not memory:
            return False
        
        memory.classification.category = new_category
        memory.classification.importance = "High"
        memory.version += 1
        await self.save(memory)
        return True

    async def archive(self, memory_id: str) -> bool:
        # Mark timeline.archived_at
        pass

    async def delete(self, memory_id: str) -> bool:
        return await self.store.delete(memory_id)
