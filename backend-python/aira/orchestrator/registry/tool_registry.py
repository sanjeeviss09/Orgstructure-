from typing import Dict, List
from aira.orchestrator.contracts.models import ToolDefinition

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        
    def register(self, tool: ToolDefinition):
        self._tools[tool.name] = tool
        
    def get_tool(self, name: str) -> ToolDefinition:
        return self._tools.get(name)
        
    def get_all(self) -> List[ToolDefinition]:
        return list(self._tools.values())
