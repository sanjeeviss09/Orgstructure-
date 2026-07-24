from typing import Dict, Any, Optional
from aira.memory.core.contracts import BaseMemoryContract

class WorkflowMemory(BaseMemoryContract):
    workflow_name: str
    current_state: str
    previous_state: Optional[str] = None
    state_data: Dict[str, Any] = {}
    is_completed: bool = False
    is_interrupted: bool = False
    next_action_required_by: Optional[str] = None
