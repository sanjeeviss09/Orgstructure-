from aira.shared.logger import get_aira_logger
from aira.agents.workflows.engine import WorkflowEngine
from aira.agents.contracts.models import AgentTask

logger = get_aira_logger("human_collaboration")

class HumanCollaborationGateway:
    def __init__(self, workflow_engine: WorkflowEngine):
        self.workflow_engine = workflow_engine
        
    def requires_approval(self, task: AgentTask) -> bool:
        if "Budget" in task.goal:
            logger.warning(f"HumanCollaboration: Task '{task.goal}' requires explicit financial approval.")
            return True
        return False
        
    async def await_approval(self, plan_id: str) -> bool:
        self.workflow_engine.pause_workflow(plan_id, "Awaiting Human Financial Approval")
        # Simulating external human intervention
        logger.info("HumanCollaboration: Human has granted approval via UI.")
        self.workflow_engine.resume_workflow(plan_id)
        return True
