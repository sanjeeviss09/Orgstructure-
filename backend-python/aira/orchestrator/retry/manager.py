import asyncio
from typing import Callable, Any
from aira.shared.logger import get_aira_logger
from aira.orchestrator.registry.capability_registry import CapabilityRegistry
from aira.orchestrator.providers.interfaces import IAIProvider

logger = get_aira_logger("retry_manager")

class RetryManager:
    def __init__(self, capability_registry: CapabilityRegistry):
        self.capability_registry = capability_registry

    async def execute_with_fallback(self, capability: str, prompt: str, max_retries: int = 2) -> str:
        provider = self.capability_registry.get_provider_for(capability)
        if not provider:
            raise Exception(f"No provider found for capability: {capability}")

        attempts = 0
        while attempts <= max_retries:
            try:
                logger.info(f"RetryManager: Attempt {attempts+1} using {provider.__class__.__name__}")
                return await provider.generate(prompt)
            except Exception as e:
                logger.warning(f"RetryManager: Provider failed: {str(e)}")
                attempts += 1
                if attempts <= max_retries:
                    logger.info("RetryManager: Backing off before retry...")
                    await asyncio.sleep(1)
        
        logger.error(f"RetryManager: All {max_retries} retries exhausted.")
        raise Exception("Execution failed after maximum retries.")
