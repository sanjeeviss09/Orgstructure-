from typing import Optional, Dict
from aira.session.interfaces import ISessionStore
from aira.contracts.session import SessionContext

class InMemorySessionStore(ISessionStore):
    def __init__(self):
        self._store: Dict[str, SessionContext] = {}

    async def get_session(self, session_id: str) -> Optional[SessionContext]:
        return self._store.get(session_id)

    async def save_session(self, session: SessionContext) -> None:
        self._store[session.session_id] = session
