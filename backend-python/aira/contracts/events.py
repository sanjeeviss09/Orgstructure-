from typing import Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class BaseEvent(BaseModel):
    event_id: str
    request_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    
class IdentityResolved(BaseEvent):
    event_type: str = "IdentityResolved"

class IntentResolved(BaseEvent):
    event_type: str = "IntentResolved"

class ContextAssembled(BaseEvent):
    event_type: str = "ContextAssembled"

class PermissionChecked(BaseEvent):
    event_type: str = "PermissionChecked"

class SessionStarted(BaseEvent):
    event_type: str = "SessionStarted"

class RequestCompleted(BaseEvent):
    event_type: str = "RequestCompleted"
