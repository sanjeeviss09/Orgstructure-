from typing import Protocol, List
from aira.retrieval.contracts.models import DocumentChunk, RetrievalResult

class IVectorStore(Protocol):
    async def index(self, chunks: List[DocumentChunk]) -> bool:
        ...
        
    async def search(self, query_vector: List[float], top_k: int = 5, filters: dict = None) -> List[RetrievalResult]:
        ...
