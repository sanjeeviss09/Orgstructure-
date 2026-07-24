import asyncio
from pprint import pprint

from aira.retrieval.contracts.models import DocumentAsset
from aira.retrieval.providers.sentence_transformers import SentenceTransformersProvider
from aira.retrieval.stores.in_memory_store import InMemoryVectorStore

from aira.retrieval.document_intelligence.classifier import DocumentIntelligenceEngine
from aira.retrieval.chunking.strategies import BasicChunkingStrategy
from aira.retrieval.pipeline.ingestion import DocumentIngestionPipeline

from aira.retrieval.hybrid.router import DomainRouter
from aira.retrieval.ranking.ranker import RankingEngine
from aira.retrieval.compression.builder import ContextBuilder

from aira.retrieval.manager.sdk import RetrievalManager

async def main():
    print("--- 1. Initializing Multi-RAG Platform ---")
    embedder = SentenceTransformersProvider()
    store = InMemoryVectorStore()
    
    # Ingestion Components
    doc_intelligence = DocumentIntelligenceEngine()
    chunker = BasicChunkingStrategy()
    pipeline = DocumentIngestionPipeline(doc_intelligence, chunker, embedder, store)
    
    # Retrieval Components
    router = DomainRouter(store)
    ranker = RankingEngine()
    context_builder = ContextBuilder()
    
    # Main SDK
    manager = RetrievalManager(pipeline, router, embedder, ranker, context_builder)

    print("\n--- 2. Ingesting Enterprise Document ---")
    policy_doc = DocumentAsset(
        tenant_id="TENANT-1",
        filename="remote_work_policy_2026.pdf",
        raw_content="All employees are allowed to work remotely 3 days a week. " * 20 # 20 sentences to force chunks
    )
    
    # Ingest routes through Intelligence -> Chunking -> Embedding -> Vector Store
    await manager.ingest(policy_doc)
    print(f"Successfully ingested and indexed chunks into the vector store.")

    print("\n--- 3. Executing Retrieval Query ---")
    query = "What is our remote work policy?"
    
    # retrieve routes through Embedder -> Router -> Vector Store -> Ranker -> Context Builder
    context_payload = await manager.retrieve(query)
    
    print("\n--- 4. Final LLM Context Payload ---")
    print(f"Total Tokens Estimated: {context_payload.total_tokens_estimated}")
    print("\nCitations Generated:")
    for citation in context_payload.citations:
        print(f"  - {citation}")
        
    print("\nTop Chunk Content:")
    if context_payload.chunks:
        print(context_payload.chunks[0].chunk.text_content[:150] + "...")
        print(f"Explanation: {context_payload.chunks[0].explanation}")

if __name__ == '__main__':
    asyncio.run(main())
