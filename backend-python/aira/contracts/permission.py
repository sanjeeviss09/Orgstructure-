from typing import Optional, List
from pydantic import BaseModel

class AuthorizationContext(BaseModel):
    is_authorized: bool = False
    restrictions: List[str] = []
    visible_departments: List[str] = []
    accessible_employees: List[str] = []
    allowed_workflows: List[str] = []
    hidden_fields: List[str] = []
    temporary_roles: List[str] = []
    escalation_required: bool = False
    denial_reason: Optional[str] = None
