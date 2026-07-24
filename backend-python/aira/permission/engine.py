import uuid
from aira.core.request_processor import IEngineMiddleware
from aira.contracts.request import RequestContext
from aira.permission.interfaces import IPermissionPolicy
from aira.shared.metrics import measure_engine_execution
from aira.events.publisher import EventPublisher
from aira.contracts.events import PermissionChecked
from aira.shared.exceptions import UnauthorizedException

class PermissionEngine(IEngineMiddleware):
    def __init__(self, policy: IPermissionPolicy):
        self.policy = policy

    @measure_engine_execution("PermissionEngine")
    async def process(self, context: RequestContext) -> None:
        auth_context = await self.policy.evaluate(context)
        context.permissions = auth_context
        
        EventPublisher.publish(PermissionChecked(
            event_id=str(uuid.uuid4()),
            request_id=context.request_id,
            payload={"is_authorized": auth_context.is_authorized, "reason": auth_context.denial_reason}
        ))
        
        if not auth_context.is_authorized:
            raise UnauthorizedException(f"Access Denied: {auth_context.denial_reason}")
