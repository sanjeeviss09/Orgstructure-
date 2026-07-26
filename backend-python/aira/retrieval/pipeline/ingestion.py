from aira.retrieval.contracts.models import DocumentAsset
from aira.retrieval.document_intelligence.classifier import DocumentIntelligenceEngine
from aira.retrieval.chunking.strategies import BasicChunkingStrategy
from aira.retrieval.embeddings.interfaces import IEmbeddingProvider
from aira.retrieval.stores.interfaces import IVectorStore

class DocumentIngestionPipeline:
    def __init__(self, intelligence: DocumentIntelligenceEngine, chunker: BasicChunkingStrategy, embedder: IEmbeddingProvider, store: IVectorStore):
        self.intelligence = intelligence
        self.chunker = chunker
        self.embedder = embedder
        self.store = store

    async def execute(self, document: DocumentAsset) -> bool:
        # 1. Classification & Intelligence
        doc = self.intelligence.process(document)
        
        # 2. Chunking
        chunks = self.chunker.chunk(doc)
        
        # 3. Embedding Generation
        texts = [c.text_content for c in chunks]
        embeddings = await self.embedder.batch_generate(texts)
        for i, chunk in enumerate(chunks):
            chunk.vector_embedding = embeddings[i]
            
        # 4. Storage & Indexing
        await self.store.index(chunks)
        return True
