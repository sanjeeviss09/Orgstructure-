from aira.orchestrator.contracts.models import AIRequest, AIResponse
from aira.orchestrator.pipeline.execution_pipeline import ExecutionPipeline

class AIOrchestrator:
    def __init__(self):
        self.pipeline = ExecutionPipeline()

    async def execute(self, request: AIRequest) -> AIResponse:
        """
        The absolute single entry point for all enterprise AI requests.
        """
        return await self.pipeline.run(request)
