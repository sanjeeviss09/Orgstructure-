import uuid
from aira.core.request_processor import IEngineMiddleware
from aira.contracts.request import RequestContext
from aira.contracts.session import SessionContext
from aira.session.interfaces import ISessionStore
from aira.shared.metrics import measure_engine_execution
from aira.events.publisher import EventPublisher
from aira.contracts.events import SessionStarted

class SessionEngine(IEngineMiddleware):
    def __init__(self, store: ISessionStore):
        self.store = store

    @measure_engine_execution("SessionEngine")
    async def process(self, context: RequestContext) -> None:
        session_id = context.metadata.get("session_id")
        session_context = None
        
        if session_id:
            session_context = await self.store.get_session(session_id)
            
        if not session_context:
            session_id = str(uuid.uuid4())
            session_context = SessionContext(session_id=session_id)
            EventPublisher.publish(SessionStarted(
                event_id=str(uuid.uuid4()),
                request_id=context.request_id,
                payload={"session_id": session_id}
            ))

        # Update session with current context
        if context.context.active_module:
            session_context.active_module = context.context.active_module
            if session_context.active_module not in session_context.navigation_history:
                session_context.navigation_history.append(session_context.active_module)
                
        # Save state
        await self.store.save_session(session_context)
        context.session = session_context
