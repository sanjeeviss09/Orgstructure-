from typing import List, Optional
from aira.memory.core.contracts import BaseMemoryContract

class ConversationMemory(BaseMemoryContract):
    session_id: str
    topic: str
    decisions: List[str] = []
    action_items: List[str] = []
    follow_ups: List[str] = []
    participants: List[str] = []
    unresolved_questions: List[str] = []
    context_summary: Optional[str] = None
