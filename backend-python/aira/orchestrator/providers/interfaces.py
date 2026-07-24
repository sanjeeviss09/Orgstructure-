from typing import Protocol, List, AsyncGenerator
from aira.orchestrator.contracts.models import AIResponse

class IAIProvider(Protocol):
    async def generate(self, prompt: str) -> str:
        ...
        
    async def stream(self, prompt: str) -> AsyncGenerator[str, None]:
        ...
        
    def token_count(self, text: str) -> int:
        ...
        
    def estimate_cost(self, tokens: int) -> float:
        ...
        
    async def health(self) -> bool:
        ...
        
    def supports_tools(self) -> bool:
        ...
