from typing import Protocol, List, Optional
from aira.memory.core.contracts import BaseMemoryContract

class IMemoryStore(Protocol):
    async def save(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        ...
        
    async def retrieve(self, memory_id: str) -> Optional[BaseMemoryContract]:
        ...
        
    async def delete(self, memory_id: str) -> bool:
        ...
