from aira.agents.registry.agent_registry import AgentRegistry
from aira.agents.communication.bus import MessageBus
from aira.agents.supervisor.supervisor_agent import SupervisorAgent
from aira.agents.specialists.domain_agents import RecruitmentAgent, HRAgent, AnalyticsAgent
from aira.agents.workflows.engine import WorkflowEngine
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("agent_manager")

class AgentManager:
    def __init__(self):
        self.registry = AgentRegistry()
        self.bus = MessageBus()
        self.workflow_engine = WorkflowEngine()
        
        # Initialize and register specialists
        self.registry.register(RecruitmentAgent())
        self.registry.register(HRAgent())
        self.registry.register(AnalyticsAgent())
        
        # Initialize supervisor
        self.supervisor = SupervisorAgent(self.registry, self.bus, self.workflow_engine)
        self.registry.register(self.supervisor)

    async def execute(self, goal: str):
        logger.info(f"AgentManager: Received goal execution request: {goal}")
        plan = await self.supervisor.decompose_goal(goal)
        
        # Pass to supervisor for execution
        await self.supervisor.execute_plan(plan)
        return plan
