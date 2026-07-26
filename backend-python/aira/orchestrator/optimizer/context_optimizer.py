from typing import List, Dict
from aira.orchestrator.contracts.models import ExecutionStep
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("context_optimizer")

class ContextOptimizer:
    def __init__(self, max_tokens: int = 2000):
        self.max_tokens = max_tokens
        
    def optimize(self, tool_results: List[ExecutionStep]) -> str:
        logger.info("ContextOptimizer: Deduplicating and compressing tool outputs...")
        # Simplistic mock optimization
        context_parts = []
        for step in tool_results:
            if step.result:
                context_parts.append(f"[{step.tool_name}]: {str(step.result)[:200]}")
                
        final_context = " | ".join(context_parts)
        if len(final_context) > self.max_tokens:
            final_context = final_context[:self.max_tokens] + "...(truncated)"
            logger.warning("ContextOptimizer: Context exceeded token budget and was truncated.")
            
        return final_context
