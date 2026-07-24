from typing import Protocol
from aira.contracts.intent import IntentContext

class IIntentClassifier(Protocol):
    async def classify(self, text: str) -> IntentContext:
        ...
