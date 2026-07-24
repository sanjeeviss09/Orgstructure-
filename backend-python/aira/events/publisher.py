from typing import Callable, Dict, List, Any
from aira.contracts.events import BaseEvent

class EventPublisher:
    _subscribers: Dict[str, List[Callable[[BaseEvent], Any]]] = {}

    @classmethod
    def subscribe(cls, event_type: str, handler: Callable[[BaseEvent], Any]):
        if event_type not in cls._subscribers:
            cls._subscribers[event_type] = []
        cls._subscribers[event_type].append(handler)

    @classmethod
    def publish(cls, event: BaseEvent):
        handlers = cls._subscribers.get(event.event_type, [])
        for handler in handlers:
            handler(event)
