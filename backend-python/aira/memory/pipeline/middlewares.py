from typing import Protocol, List
from aira.memory.core.contracts import BaseMemoryContract
from aira.shared.logger import get_aira_logger
from aira.events.publisher import EventPublisher
from aira.memory.store.interfaces import IMemoryStore

logger = get_aira_logger("memory_pipeline")

class IMemoryMiddleware(Protocol):
    async def process(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        ...

class ValidationMiddleware(IMemoryMiddleware):
    async def process(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        # Pydantic validation handles most, custom checks here
        if not memory.tenant_id or not memory.owner_id:
            raise ValueError("Tenant ID and Owner ID are required")
        return memory

class SecurityMiddleware(IMemoryMiddleware):
    async def process(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        # Basic permission defaults
        if not memory.classification.visibility:
            memory.classification.visibility = "Private"
        return memory

class StorageMiddleware(IMemoryMiddleware):
    def __init__(self, store: IMemoryStore):
        self.store = store

    async def process(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        saved_memory = await self.store.save(memory)
        return saved_memory

class MemoryProcessingPipeline:
    def __init__(self, middlewares: List[IMemoryMiddleware]):
        self.middlewares = middlewares

    async def execute(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        logger.info(f"Memory Pipeline Execution started for {memory.memory_id}")
        current_memory = memory
        for mw in self.middlewares:
            logger.info(f"Executing: {mw.__class__.__name__}")
            current_memory = await mw.process(current_memory)
        return current_memory
