from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class EnterpriseContext(BaseModel):
    organizational_structure: Dict[str, Any] = {}
    department_info: Dict[str, Any] = {}
    current_workflow: Optional[str] = None
    open_tasks: List[str] = []
    reporting_hierarchy: List[str] = []
    business_rules: List[str] = []
    policies: List[str] = []
    organizational_settings: Dict[str, Any] = {}
    related_documents: List[str] = []
    previous_requests: List[str] = []
    historical_activities: List[str] = []
    application_state: Dict[str, Any] = {}
    current_screen: Optional[str] = None
    active_module: Optional[str] = None
