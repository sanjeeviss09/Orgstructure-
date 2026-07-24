from typing import List
from aira.memory.core.contracts import BaseMemoryContract

class RetrievalStrategy:
    @staticmethod
    def score_and_rank(memories: List[BaseMemoryContract], context_filter: dict) -> List[BaseMemoryContract]:
        # Sort by recency (created_at) descending by default, prioritizing High/Critical importance
        
        def compute_score(memory: BaseMemoryContract) -> float:
            score = 0.0
            if memory.classification.importance == "Critical":
                score += 50.0
            elif memory.classification.importance == "High":
                score += 25.0
            
            # Boost if workflow matches
            if memory.workflow_id and memory.workflow_id == context_filter.get("workflow_id"):
                score += 30.0
                
            return score + memory.classification.confidence
            
        ranked = sorted(memories, key=compute_score, reverse=True)
        return ranked
