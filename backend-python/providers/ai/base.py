from abc import ABC, abstractmethod
from typing import Any, Dict, List

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, context: Optional[List[Dict[str, str]]] = None) -> str:
        pass
