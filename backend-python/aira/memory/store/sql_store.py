from typing import Optional, Dict
from aira.memory.store.interfaces import IMemoryStore
from aira.memory.core.contracts import BaseMemoryContract

class MockSQLMemoryStore(IMemoryStore):
    def __init__(self):
        self._db: Dict[str, BaseMemoryContract] = {}

    async def save(self, memory: BaseMemoryContract) -> BaseMemoryContract:
        self._db[memory.memory_id] = memory
        return memory

    async def retrieve(self, memory_id: str) -> Optional[BaseMemoryContract]:
        return self._db.get(memory_id)

    async def delete(self, memory_id: str) -> bool:
        if memory_id in self._db:
            del self._db[memory_id]
            return True
        return False
