from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class IdentityContext(BaseModel):
    cognito_user_id: Optional[str] = None
    employee_id: Optional[str] = None
    candidate_id: Optional[str] = None
    visitor_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    employment_status: Optional[str] = None
    user_category: Optional[str] = None
    business_unit: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    reporting_manager: Optional[str] = None
    organization_hierarchy: List[str] = []
    active_roles: List[str] = []
    effective_permissions: List[str] = []
    assigned_workflows: List[str] = []
    active_delegations: List[str] = []
    preferred_language: str = "en-US"
    time_zone: str = "UTC"
    accessibility_preferences: Dict[str, Any] = {}
    dashboard_preferences: Dict[str, Any] = {}
