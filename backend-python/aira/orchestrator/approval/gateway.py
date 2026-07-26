from aira.orchestrator.contracts.models import ExecutionPlan
from aira.shared.logger import get_aira_logger
from aira.orchestrator.registry.tool_registry import ToolRegistry

logger = get_aira_logger("approval_gateway")

class HumanApprovalGateway:
    def __init__(self, tool_registry: ToolRegistry):
        self.tool_registry = tool_registry
        
    def requires_approval(self, plan: ExecutionPlan) -> bool:
        for step in plan.steps:
            tool = self.tool_registry.get_tool(step.tool_name)
            if tool and tool.requires_approval:
                logger.warning(f"HumanApprovalGateway: Step {step.tool_name} requires human approval.")
                return True
        return False
        
    def process_approval(self, plan: ExecutionPlan, approved: bool = True) -> bool:
        if approved:
            logger.info("HumanApprovalGateway: Human approval granted.")
            return True
        else:
            logger.error("HumanApprovalGateway: Human approval denied.")
            return False
