from typing import List
from aira.agents.contracts.models import AgentMessage
from aira.shared.logger import get_aira_logger

logger = get_aira_logger("message_bus")

class MessageBus:
    def __init__(self):
        self.messages: List[AgentMessage] = []
        
    def publish(self, message: AgentMessage):
        logger.info(f"MessageBus: {message.sender} -> {message.recipient}: {message.content}")
        self.messages.append(message)
        
    def get_messages_for(self, recipient: str) -> List[AgentMessage]:
        return [m for m in self.messages if m.recipient == recipient]
