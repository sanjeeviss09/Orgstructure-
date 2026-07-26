from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from aira.contracts.identity import IdentityContext
from aira.contracts.intent import IntentContext
from aira.contracts.context import EnterpriseContext
from aira.contracts.permission import AuthorizationContext
from aira.contracts.session import SessionContext

class EngineMetrics(BaseModel):
    execution_time_ms: float = 0.0
    confidence: float = 1.0
    warnings: List[str] = []
    errors: List[str] = []
    trace_id: Optional[str] = None

class RequestContext(BaseModel):
    request_id: str
    tenant_id: str
    raw_query: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    language: str = "en-US"
    
    # Context objects populated by engines
    identity: IdentityContext = Field(default_factory=IdentityContext)
    intent: IntentContext = Field(default_factory=IntentContext)
    context: EnterpriseContext = Field(default_factory=EnterpriseContext)
    permissions: AuthorizationContext = Field(default_factory=AuthorizationContext)
    session: SessionContext = Field(default_factory=SessionContext)
    
    # Metrics populated by engines
    metrics: Dict[str, EngineMetrics] = Field(default_factory=dict)
    
    # General metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

# The final immutable object
class AIRequest(BaseModel):
    request_id: str
    tenant_id: str
    raw_query: str
    timestamp: str
    language: str
    
    identity: IdentityContext
    intent: IntentContext
    context: EnterpriseContext
    permissions: AuthorizationContext
    session: SessionContext
    
    metrics: Dict[str, EngineMetrics]
    metadata: Dict[str, Any]
    
    class Config:
        frozen = True

    @classmethod
    def from_context(cls, ctx: RequestContext) -> "AIRequest":
        return cls(**ctx.model_dump())
