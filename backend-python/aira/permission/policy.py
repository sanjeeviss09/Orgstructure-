from aira.permission.interfaces import IPermissionPolicy
from aira.contracts.request import RequestContext
from aira.contracts.permission import AuthorizationContext

class DefaultPermissionPolicy(IPermissionPolicy):
    async def evaluate(self, request_context: RequestContext) -> AuthorizationContext:
        identity = request_context.identity
        intent = request_context.intent
        
        is_authorized = True
        denial_reason = None
        
        # Simple Phase 1 Rule: If intent is high risk and user is just an employee, deny.
        if intent.risk_level == "High" and "Executive" not in identity.active_roles:
            is_authorized = False
            denial_reason = "User does not have sufficient clearance for High risk operations."
            
        return AuthorizationContext(
            is_authorized=is_authorized,
            denial_reason=denial_reason,
            visible_departments=[identity.department] if identity.department else [],
            accessible_employees=[]
        )
