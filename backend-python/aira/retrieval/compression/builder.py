from typing import List
from aira.retrieval.contracts.models import RetrievalResult, RetrievalContext

class ContextBuilder:
    def build(self, request_id: str, ranked_results: List[RetrievalResult], token_budget: int = 4000) -> RetrievalContext:
        context = RetrievalContext(request_id=request_id)
        current_tokens = 0
        
        for res in ranked_results:
            # Rough estimate: 1 word = 1.3 tokens
            estimated_tokens = int(len(res.chunk.text_content.split()) * 1.3)
            if current_tokens + estimated_tokens > token_budget:
                break
                
            context.chunks.append(res)
            context.citations.append(f"Doc: {res.chunk.document_id} | Type: {res.chunk.classification} | Chunk: {res.chunk.metadata.chunk_index}")
            current_tokens += estimated_tokens
            
        context.total_tokens_estimated = current_tokens
        return context
