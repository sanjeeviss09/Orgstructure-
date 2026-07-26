from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator
import uuid
import hashlib

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

class MemoryClassification(BaseModel):
    category: str
    memory_type: str
    importance: str = "Medium"  # Low, Medium, High, Critical
    sensitivity: str = "Internal" # Public, Internal, Confidential, Restricted
    visibility: str = "Private" # Private, Team, Department, Enterprise
    retention: str = "Indefinite" # 1 Year, 5 Years, Indefinite, Session
    confidence: float = 1.0

class MemoryRelationships(BaseModel):
    related_memory_ids: List[str] = Field(default_factory=list)
    parent_memory_id: Optional[str] = None
    child_memory_ids: List[str] = Field(default_factory=list)
    references: List[str] = Field(default_factory=list)

class MemoryTimeline(BaseModel):
    created_at: str = Field(default_factory=get_utc_now)
    updated_at: str = Field(default_factory=get_utc_now)
    archived_at: Optional[str] = None
    restored_at: Optional[str] = None
    deleted_at: Optional[str] = None

class BaseMemoryContract(BaseModel):
    memory_id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    owner_id: str
    creator_id: str
    created_by_ai: bool = False
    source_system: str
    department: Optional[str] = None
    business_unit: Optional[str] = None
    workflow_id: Optional[str] = None
    module: Optional[str] = None
    
    language: str = "en-US"
    
    classification: MemoryClassification
    relationships: MemoryRelationships = Field(default_factory=MemoryRelationships)
    timeline: MemoryTimeline = Field(default_factory=MemoryTimeline)
    
    version: int = 1
    checksum: Optional[str] = None
    audit_id: str = Field(default_factory=generate_uuid)

    def compute_checksum(self, payload_dict: dict) -> str:
        data_str = str(sorted(payload_dict.items()))
        return hashlib.sha256(data_str.encode()).hexdigest()
