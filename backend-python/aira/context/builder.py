from aira.context.interfaces import IContextBuilder
from aira.contracts.request import RequestContext
from aira.contracts.context import EnterpriseContext

class DefaultContextBuilder(IContextBuilder):
    async def build(self, request_context: RequestContext) -> EnterpriseContext:
        # In Phase 1, we simulate fetching context using Identity & Intent
        identity = request_context.identity
        intent = request_context.intent
        
        department_info = {}
        if identity.department:
            department_info["name"] = identity.department
            department_info["manager"] = identity.reporting_manager
            
        return EnterpriseContext(
            organizational_structure={"hierarchy": identity.organization_hierarchy},
            department_info=department_info,
            current_workflow=intent.workflow_type,
            active_module=request_context.metadata.get("active_module")
        )
