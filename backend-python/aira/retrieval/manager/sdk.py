from typing import List, Optional
from aira.retrieval.contracts.models import DocumentAsset, RetrievalContext
from aira.retrieval.pipeline.ingestion import DocumentIngestionPipeline
from aira.retrieval.hybrid.router import DomainRouter
from aira.retrieval.embeddings.interfaces import IEmbeddingProvider
from aira.retrieval.ranking.ranker import RankingEngine
from aira.retrieval.compression.builder import ContextBuilder
from aira.shared.logger import get_aira_logger
import uuid

logger = get_aira_logger("retrieval_sdk")

class RetrievalManager:
    def __init__(self, 
                 pipeline: DocumentIngestionPipeline, 
                 router: DomainRouter, 
                 embedder: IEmbeddingProvider,
                 ranker: RankingEngine,
                 context_builder: ContextBuilder):
        self.pipeline = pipeline
        self.router = router
        self.embedder = embedder
        self.ranker = ranker
        self.context_builder = context_builder

    async def ingest(self, document: DocumentAsset) -> bool:
        logger.info(f"Retrieval SDK: Ingesting document {document.filename}")
        return await self.pipeline.execute(document)

    async def retrieve(self, query: str, context_filters: dict = None) -> RetrievalContext:
        """The main orchestration method bridging Semantic Search, Ranking, and Compression."""
        logger.info(f"Retrieval SDK: Retrieving context for query: '{query}'")
        
        # 1. Route to correct repository
        store = self.router.route(query)
        
        # 2. Semantic query embedding
        query_vector = await self.embedder.generate(query)
        
        # 3. Hybrid Search
        results = await store.search(query_vector, top_k=10, filters=context_filters)
        
        # 4. Explainable Ranking
        ranked_results = self.ranker.rank(results)
        
        # 5. Context Builder & Compression
        context = self.context_builder.build(
            request_id=str(uuid.uuid4()),
            ranked_results=ranked_results,
            token_budget=2000
        )
        return context
