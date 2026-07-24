from typing import Dict, Any
from aira.memory.core.contracts import BaseMemoryContract

class WorkingMemory(BaseMemoryContract):
    request_id: str
    reasoning_context: Dict[str, Any] = {}
    intermediate_results: Dict[str, Any] = {}
    is_promoted: bool = False
