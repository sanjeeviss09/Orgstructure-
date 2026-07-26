import asyncio
from typing import List
from aira.agents.registry.agent_registry import AgentRegistry, BaseAgent
from aira.agents.contracts.models import AgentExecutionPlan, AgentTask, AgentMessage
from aira.agents.communication.bus import MessageBus
from aira.agents.collaboration.human_checkpoint import HumanCollaborationGateway
from aira.agents.workflows.engine import WorkflowEngine
from aira.agents.governance.policies import AgentGovernance
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("supervisor_agent")

class SupervisorAgent(BaseAgent):
    def __init__(self, registry: AgentRegistry, bus: MessageBus, workflow_engine: WorkflowEngine):
        super().__init__("SupervisorAgent", "Master coordinator for all specialist agents.")
        self.registry = registry
        self.bus = bus
        self.workflow_engine = workflow_engine
        self.collaboration_gateway = HumanCollaborationGateway(workflow_engine)
        self.governance = AgentGovernance()

    async def decompose_goal(self, goal: str) -> AgentExecutionPlan:
        logger.info(f"SupervisorAgent: Decomposing business goal: {goal}")
        plan = AgentExecutionPlan(business_goal=goal)
        
        # Hardcoding the decomposition logic for this demo
        t1 = AgentTask(goal="Identify Open Scientist Positions", assigned_to="RecruitmentAgent")
        t2 = AgentTask(goal="Validate Recruitment Budget", assigned_to="HRAgent")
        t3 = AgentTask(goal="Estimate Hiring Timeline", assigned_to="AnalyticsAgent")
        
        plan.tasks = [t1, t2, t3]
        return plan

    async def execute_plan(self, plan: AgentExecutionPlan):
        logger.info(f"SupervisorAgent: Executing plan {plan.plan_id}")
        await self.workflow_engine.run(plan)
        
        for task in plan.tasks:
            if self.collaboration_gateway.requires_approval(task):
                await self.collaboration_gateway.await_approval(plan.plan_id)
                
            agent = self.registry.get_agent(task.assigned_to)
            if not agent:
                logger.error(f"SupervisorAgent: Assigned agent {task.assigned_to} not found.")
                continue
                
            if not self.governance.validate_execution(agent.name):
                logger.error(f"SupervisorAgent: Governance policies blocked execution for {agent.name}")
                continue
                
            # Message bus orchestration
            msg_out = AgentMessage(sender=self.name, recipient=agent.name, content=task)
            self.bus.publish(msg_out)
            
            result = await agent.process_task(task)
            
            msg_in = AgentMessage(sender=agent.name, recipient=self.name, content=result)
            self.bus.publish(msg_in)
            
            task.status = result.status
            logger.info(f"SupervisorAgent: Received result from {agent.name}: {result.output}")
        
        plan.status = "COMPLETED"
        logger.info(f"SupervisorAgent: Plan {plan.plan_id} completed successfully.")
