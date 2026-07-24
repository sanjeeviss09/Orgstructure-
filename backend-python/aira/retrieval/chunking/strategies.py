from typing import List
from aira.retrieval.contracts.models import DocumentAsset, DocumentChunk, ChunkMetadata

class BasicChunkingStrategy:
    def chunk(self, document: DocumentAsset, chunk_size: int = 500) -> List[DocumentChunk]:
        """Simple character based chunker for demonstration."""
        text = document.raw_content
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunk_text = text[i:i+chunk_size]
            chunks.append(DocumentChunk(
                document_id=document.document_id,
                tenant_id=document.tenant_id,
                text_content=chunk_text,
                owner_id=document.owner_id,
                department=document.department,
                classification=document.classification,
                sensitivity=document.sensitivity,
                metadata=ChunkMetadata(chunk_index=len(chunks))
            ))
        # Establish chunk relationships
        for i, c in enumerate(chunks):
            if i > 0: c.metadata.prev_chunk_id = chunks[i-1].chunk_id
            if i < len(chunks)-1: c.metadata.next_chunk_id = chunks[i+1].chunk_id
        return chunks
