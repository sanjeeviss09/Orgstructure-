import uuid
from aira.core.request_processor import IEngineMiddleware
from aira.contracts.request import RequestContext
from aira.context.interfaces import IContextBuilder
from aira.shared.metrics import measure_engine_execution
from aira.events.publisher import EventPublisher
from aira.contracts.events import ContextAssembled

class ContextEngine(IEngineMiddleware):
    def __init__(self, builder: IContextBuilder):
        self.builder = builder

    @measure_engine_execution("ContextEngine")
    async def process(self, context: RequestContext) -> None:
        enterprise_context = await self.builder.build(context)
        context.context = enterprise_context
        
        EventPublisher.publish(ContextAssembled(
            event_id=str(uuid.uuid4()),
            request_id=context.request_id,
            payload={"department": enterprise_context.department_info.get("name")}
        ))
