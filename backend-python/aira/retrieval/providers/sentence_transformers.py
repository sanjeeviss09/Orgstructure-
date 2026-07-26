from typing import List
from aira.retrieval.embeddings.interfaces import IEmbeddingProvider
from sentence_transformers import SentenceTransformer

class SentenceTransformersProvider(IEmbeddingProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        # This will download the model the first time it is instantiated
        self.model = SentenceTransformer(model_name)

    async def generate(self, text: str) -> List[float]:
        embedding = self.model.encode(text)
        return embedding.tolist()
        
    async def batch_generate(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return [emb.tolist() for emb in embeddings]
