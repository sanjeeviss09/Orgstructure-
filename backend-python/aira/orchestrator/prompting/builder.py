from aira.orchestrator.contracts.models import AIRequest
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("prompt_builder")

class PromptBuilder:
    def __init__(self):
        self.version = "1.0.0"
        
    def build_prompt(self, request: AIRequest, optimized_context: str) -> str:
        logger.info(f"PromptBuilder: Constructing prompt v{self.version}")
        # Merge User Query, Identity, and Context
        prompt = (
            f"You are AIRA, the Enterprise AI.\n"
            f"User Identity: {request.identity_context.active_roles} in {request.identity_context.department}\n"
            f"Retrieved Context: {optimized_context}\n"
            f"Task: {request.user_query}\n"
            f"Generate the final response."
        )
        return prompt
