import httpx
from typing import Any, Dict
from aira.orchestrator.providers.interfaces import IAIProvider
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("nvidia_provider")

class NvidiaAIProvider(IAIProvider):
    def __init__(self, api_key: str, model: str = "meta/llama-3.1-8b-instruct"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://integrate.api.nvidia.com/v1/chat/completions"

    async def generate(self, prompt: str, context: Dict[str, Any] = None) -> str:
        logger.info(f"NvidiaAIProvider: Calling real LLM ({self.model})...")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # In a real pipeline, we pass full message history. Here we just take the constructed prompt/history.
        # If context has 'messages', use them, else construct from prompt.
        messages = context.get("messages", [{"role": "user", "content": prompt}]) if context else [{"role": "user", "content": prompt}]
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 500
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.base_url, json=payload, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"NvidiaAIProvider failed: {str(e)}")
                raise

    async def stream(self, prompt: str, context: Dict[str, Any] = None):
        raise NotImplementedError("Streaming not yet implemented.")

    def count_tokens(self, text: str) -> int:
        return len(text.split())

    def estimate_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        return 0.0
