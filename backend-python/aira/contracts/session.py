from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class SessionContext(BaseModel):
    session_id: Optional[str] = None
    active_module: Optional[str] = None
    navigation_history: List[str] = []
    current_task: Optional[str] = None
    workflow_state: Dict[str, Any] = {}
    conversation_state: Dict[str, Any] = {}
    user_focus: Optional[str] = None
    is_expired: bool = False
    is_idle: bool = False
