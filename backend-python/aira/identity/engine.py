import uuid
from aira.core.request_processor import IEngineMiddleware
from aira.contracts.request import RequestContext
from aira.identity.interfaces import IIdentityProvider
from aira.shared.metrics import measure_engine_execution
from aira.events.publisher import EventPublisher
from aira.contracts.events import IdentityResolved

class IdentityEngine(IEngineMiddleware):
    def __init__(self, identity_provider: IIdentityProvider):
        self.provider = identity_provider

    @measure_engine_execution("IdentityEngine")
    async def process(self, context: RequestContext) -> None:
        # In a real flow, raw_query or metadata would contain the token/cognito_id
        # We mock extraction here
        cognito_id = context.metadata.get("cognito_id", "mock-cognito-123")
        
        identity_context = await self.provider.fetch_identity_context(cognito_id)
        context.identity = identity_context
        
        # Publish Event
        EventPublisher.publish(IdentityResolved(
            event_id=str(uuid.uuid4()),
            request_id=context.request_id,
            payload={"employee_id": identity_context.employee_id}
        ))
