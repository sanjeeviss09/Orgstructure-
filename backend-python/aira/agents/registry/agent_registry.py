from typing import Dict, List, Any

class BaseAgent:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        
    async def process_task(self, task: Any) -> Any:
        raise NotImplementedError

class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        
    def register(self, agent: BaseAgent):
        self._agents[agent.name] = agent
        
    def get_agent(self, name: str) -> BaseAgent:
        return self._agents.get(name)
        
    def list_agents(self) -> List[str]:
        return list(self._agents.keys())
