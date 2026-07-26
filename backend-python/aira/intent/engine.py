import uuid
from aira.core.request_processor import IEngineMiddleware
from aira.contracts.request import RequestContext
from aira.intent.interfaces import IIntentClassifier
from aira.shared.metrics import measure_engine_execution
from aira.events.publisher import EventPublisher
from aira.contracts.events import IntentResolved

class IntentEngine(IEngineMiddleware):
    def __init__(self, classifier: IIntentClassifier):
        self.classifier = classifier

    @measure_engine_execution("IntentEngine")
    async def process(self, context: RequestContext) -> None:
        intent_context = await self.classifier.classify(context.raw_query)
        context.intent = intent_context
        
        EventPublisher.publish(IntentResolved(
            event_id=str(uuid.uuid4()),
            request_id=context.request_id,
            payload={"primary_intent": intent_context.primary_intent}
        ))
