from typing import Protocol, Optional
from aira.contracts.session import SessionContext

class ISessionStore(Protocol):
    async def get_session(self, session_id: str) -> Optional[SessionContext]:
        ...
    
    async def save_session(self, session: SessionContext) -> None:
        ...
