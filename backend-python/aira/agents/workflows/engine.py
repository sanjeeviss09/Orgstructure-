import asyncio
from typing import Optional
from aira.agents.contracts.models import AgentExecutionPlan
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("agent_workflow_engine")

class WorkflowEngine:
    def __init__(self):
        self._paused_workflows = {}
        
    async def run(self, plan: AgentExecutionPlan):
        logger.info(f"WorkflowEngine: Starting workflow {plan.plan_id}")
        plan.status = "RUNNING"
        
    def pause_workflow(self, plan_id: str, reason: str):
        logger.warning(f"WorkflowEngine: Pausing workflow {plan_id}. Reason: {reason}")
        self._paused_workflows[plan_id] = "PAUSED"
        
    def resume_workflow(self, plan_id: str):
        if plan_id in self._paused_workflows:
            logger.info(f"WorkflowEngine: Resuming workflow {plan_id}")
            del self._paused_workflows[plan_id]
        else:
            logger.error(f"WorkflowEngine: Workflow {plan_id} is not paused.")
