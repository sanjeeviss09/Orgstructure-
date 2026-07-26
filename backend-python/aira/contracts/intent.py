from typing import Optional, List
from pydantic import BaseModel

class IntentContext(BaseModel):
    primary_intent: Optional[str] = None
    secondary_intents: List[str] = []
    business_domain: Optional[str] = None
    department: Optional[str] = None
    workflow_type: Optional[str] = None
    urgency: str = "Normal"
    expected_output: Optional[str] = None
    risk_level: str = "Low"
    clarification_required: bool = False
    affects_sensitive_data: bool = False
