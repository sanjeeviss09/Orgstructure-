from typing import List
from aira.retrieval.contracts.models import RetrievalResult

class RankingEngine:
    def rank(self, results: List[RetrievalResult]) -> List[RetrievalResult]:
        for res in results:
            # Base logic combining semantic score, graph proximity, freshness
            res.final_score = res.semantic_score + res.graph_distance + res.freshness_score
            res.explanation = f"Semantic: {res.semantic_score:.2f}, Graph Boost: {res.graph_distance}"
        
        # Sort by final score
        results.sort(key=lambda x: x.final_score, reverse=True)
        return results
