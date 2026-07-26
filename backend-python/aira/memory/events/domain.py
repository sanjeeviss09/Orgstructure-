from aira.contracts.events import BaseEvent

class ConversationCreated(BaseEvent):
    event_type: str = "ConversationCreated"

class WorkflowUpdated(BaseEvent):
    event_type: str = "WorkflowUpdated"

class DecisionRecorded(BaseEvent):
    event_type: str = "DecisionRecorded"

class PreferenceChanged(BaseEvent):
    event_type: str = "PreferenceChanged"

class KnowledgeIndexed(BaseEvent):
    event_type: str = "KnowledgeIndexed"

class AnalyticsSnapshotCreated(BaseEvent):
    event_type: str = "AnalyticsSnapshotCreated"
