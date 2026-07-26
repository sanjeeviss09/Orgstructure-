from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

class DocumentAsset(BaseModel):
    document_id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    filename: str
    raw_content: str
    
    # Injected by DocumentIntelligence
    owner_id: Optional[str] = None
    department: Optional[str] = None
    classification: str = "Unclassified"  # Policy, SOP, Resume, etc.
    sensitivity: str = "Internal"
    workflow_id: Optional[str] = None
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=get_utc_now)
    version: int = 1

class ChunkMetadata(BaseModel):
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    chunk_index: int = 0
    parent_chunk_id: Optional[str] = None
    next_chunk_id: Optional[str] = None
    prev_chunk_id: Optional[str] = None

class DocumentChunk(BaseModel):
    chunk_id: str = Field(default_factory=generate_uuid)
    document_id: str
    tenant_id: str
    text_content: str
    vector_embedding: Optional[List[float]] = None
    
    # Inherited from DocumentAsset
    owner_id: Optional[str] = None
    department: Optional[str] = None
    classification: str = "Unclassified"
    sensitivity: str = "Internal"
    
    metadata: ChunkMetadata = Field(default_factory=ChunkMetadata)

class RetrievalResult(BaseModel):
    chunk: DocumentChunk
    semantic_score: float = 0.0
    graph_distance: int = 0
    freshness_score: float = 0.0
    final_score: float = 0.0
    explanation: str = ""

class RetrievalContext(BaseModel):
    request_id: str
    chunks: List[RetrievalResult] = []
    citations: List[str] = []
    total_tokens_estimated: int = 0
