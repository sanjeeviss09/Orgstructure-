from typing import Protocol, List

class IEmbeddingProvider(Protocol):
    async def generate(self, text: str) -> List[float]:
        ...
        
    async def batch_generate(self, texts: List[str]) -> List[List[float]]:
        ...
