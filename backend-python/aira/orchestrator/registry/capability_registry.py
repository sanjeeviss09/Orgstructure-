from typing import Dict
from aira.orchestrator.providers.interfaces import IAIProvider

class CapabilityRegistry:
    def __init__(self):
        # Maps capability name -> IAIProvider
        self._capabilities: Dict[str, IAIProvider] = {}
        
    def register(self, capability: str, provider: IAIProvider):
        self._capabilities[capability] = provider
        
    def get_provider_for(self, capability: str) -> IAIProvider:
        return self._capabilities.get(capability)
