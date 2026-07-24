from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone
from aira.retrieval.contracts.models import RetrievalContext
from aira.contracts.identity import IdentityContext

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

class AIRequest(BaseModel):
    request_id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    user_query: str
    identity_context: IdentityContext
    retrieval_context: Optional[RetrievalContext] = None
    created_at: str = Field(default_factory=get_utc_now)
    # Allows bypassing tools for simple queries
    force_direct_response: bool = False

class ToolDefinition(BaseModel):
    name: str
    description: str
    is_read_only: bool
    requires_approval: bool = False
    timeout_ms: int = 5000

class ExecutionStep(BaseModel):
    step_id: str = Field(default_factory=generate_uuid)
    tool_name: str
    inputs: Dict[str, Any]
    status: str = "PENDING"  # PENDING, RUNNING, COMPLETED, FAILED, AWAITING_APPROVAL
    dependencies: List[str] = [] # list of step_ids
    result: Optional[Any] = None

class ExecutionPlan(BaseModel):
    plan_id: str = Field(default_factory=generate_uuid)
    request_id: str
    steps: List[ExecutionStep] = []
    
class AIResponse(BaseModel):
    request_id: str
    content: str
    execution_plan: Optional[ExecutionPlan] = None
    confidence_score: float = 0.0
    citations_used: List[str] = []
    total_tokens: int = 0
    total_cost: float = 0.0
    provider_used: str = "Unknown"
    created_at: str = Field(default_factory=get_utc_now)
