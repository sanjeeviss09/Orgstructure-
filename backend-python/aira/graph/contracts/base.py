from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

class GraphNode(BaseModel):
    node_id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    label: str  # e.g., "Employee", "Policy", "Department"
    properties: Dict[str, Any] = Field(default_factory=dict)
    permissions: Dict[str, Any] = Field(default_factory=dict)  # RBAC matching
    created_at: str = Field(default_factory=get_utc_now)
    updated_at: str = Field(default_factory=get_utc_now)
    version: int = 1
    is_active: bool = True

class GraphRelationship(BaseModel):
    rel_id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    source_id: str
    target_id: str
    type: str  # e.g., "REPORTS_TO", "OWNS"
    properties: Dict[str, Any] = Field(default_factory=dict)
    permissions: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    valid_from: str = Field(default_factory=get_utc_now)
    valid_to: Optional[str] = None
    created_at: str = Field(default_factory=get_utc_now)
    updated_at: str = Field(default_factory=get_utc_now)
    version: int = 1
    is_active: bool = True
