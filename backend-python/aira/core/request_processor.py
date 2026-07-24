from typing import List, Protocol
from aira.contracts.request import RequestContext, AIRequest
from aira.shared.logger import get_aira_logger
from aira.events.publisher import EventPublisher
from aira.contracts.events import RequestCompleted

logger = get_aira_logger("processor")

class IEngineMiddleware(Protocol):
    async def process(self, context: RequestContext) -> None:
        ...

class AIRARequestProcessor:
    def __init__(self):
        self.middlewares: List[IEngineMiddleware] = []

    def add_middleware(self, middleware: IEngineMiddleware):
        self.middlewares.append(middleware)

    async def execute(self, context: RequestContext) -> AIRequest:
        logger.info(f"Starting AIRA Request Processing for ID: {context.request_id}")
        
        for middleware in self.middlewares:
            middleware_name = middleware.__class__.__name__
            logger.info(f"Executing middleware: {middleware_name}")
            try:
                await middleware.process(context)
            except Exception as e:
                logger.error(f"Error in {middleware_name}: {e}")
                # We do not halt on all errors, but depends on business logic
                # For Phase 1, we let it crash to expose bugs
                raise

        # Build final immutable request
        ai_request = AIRequest.from_context(context)
        
        # Publish completion
        EventPublisher.publish(RequestCompleted(
            event_id=context.request_id + "_completed",
            request_id=context.request_id,
            payload={"metrics": {k: v.model_dump() for k, v in context.metrics.items()}}
        ))
        
        logger.info(f"Finished AIRA Request Processing for ID: {context.request_id}")
        return ai_request
