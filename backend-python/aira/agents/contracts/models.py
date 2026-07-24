from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

class AgentTask(BaseModel):
    task_id: str = Field(default_factory=generate_uuid)
    goal: str
    context: Dict[str, Any] = {}
    assigned_to: Optional[str] = None
    status: str = "PENDING"
    created_at: str = Field(default_factory=get_utc_now)

class AgentResult(BaseModel):
    task_id: str
    status: str
    output: Any
    confidence: float = 0.0
    error_message: Optional[str] = None
    completed_at: str = Field(default_factory=get_utc_now)

class AgentExecutionPlan(BaseModel):
    plan_id: str = Field(default_factory=generate_uuid)
    business_goal: str
    tasks: List[AgentTask] = []
    status: str = "DRAFT"
    
class AgentMessage(BaseModel):
    message_id: str = Field(default_factory=generate_uuid)
    sender: str
    recipient: str
    content: Any
    timestamp: str = Field(default_factory=get_utc_now)
