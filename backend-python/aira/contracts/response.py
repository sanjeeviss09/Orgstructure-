from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class AIResponse(BaseModel):
    request_id: str
    response_text: str
    confidence_score: float
    metadata: Dict[str, Any] = {}
