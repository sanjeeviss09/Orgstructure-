from typing import List, Dict
import math
from aira.retrieval.stores.interfaces import IVectorStore
from aira.retrieval.contracts.models import DocumentChunk, RetrievalResult

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

class InMemoryVectorStore(IVectorStore):
    def __init__(self):
        self.chunks: List[DocumentChunk] = []

    async def index(self, chunks: List[DocumentChunk]) -> bool:
        self.chunks.extend(chunks)
        return True

    async def search(self, query_vector: List[float], top_k: int = 5, filters: dict = None) -> List[RetrievalResult]:
        results = []
        for chunk in self.chunks:
            # Simple permission/metadata filtering
            if filters:
                skip = False
                for k, v in filters.items():
                    if getattr(chunk, k, None) != v:
                        skip = True
                        break
                if skip: continue
                
            if chunk.vector_embedding:
                score = cosine_similarity(query_vector, chunk.vector_embedding)
                results.append(RetrievalResult(chunk=chunk, semantic_score=score))
        
        # Sort by score descending
        results.sort(key=lambda x: x.semantic_score, reverse=True)
        return results[:top_k]
