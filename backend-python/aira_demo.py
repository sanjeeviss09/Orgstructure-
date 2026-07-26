import asyncio
import uuid
import json
from pprint import pprint

from aira.core.request_processor import AIRARequestProcessor
from aira.contracts.request import RequestContext

from aira.identity.repository import MockUserRepository, MockRoleRepository
from aira.identity.provider import DefaultIdentityProvider
from aira.identity.engine import IdentityEngine

from aira.intent.classifier import HeuristicIntentClassifier
from aira.intent.engine import IntentEngine

from aira.context.builder import DefaultContextBuilder
from aira.context.engine import ContextEngine

from aira.permission.policy import DefaultPermissionPolicy
from aira.permission.engine import PermissionEngine

from aira.session.store import InMemorySessionStore
from aira.session.engine import SessionEngine

from aira.events.publisher import EventPublisher

from aira.memory.store.sql_store import MockSQLMemoryStore
from aira.memory.pipeline.middlewares import MemoryProcessingPipeline, ValidationMiddleware, SecurityMiddleware, StorageMiddleware
from aira.memory.manager.sdk import MemoryManager
from aira.memory.core.contracts import MemoryClassification
from aira.memory.contracts.workflow import WorkflowMemory

def event_logger(event):
    print(f"[EVENT] {event.event_type} | ID: {event.event_id} | Payload: {event.payload}")

async def main():
    EventPublisher.subscribe("IdentityResolved", event_logger)
    EventPublisher.subscribe("WorkflowMemoryCreated", event_logger)

    # --- Phase 1 Setup ---
    user_repo = MockUserRepository()
    role_repo = MockRoleRepository()
    identity_provider = DefaultIdentityProvider(user_repo, role_repo)
    intent_classifier = HeuristicIntentClassifier()
    context_builder = DefaultContextBuilder()
    permission_policy = DefaultPermissionPolicy()
    session_store = InMemorySessionStore()

    processor = AIRARequestProcessor()
    processor.add_middleware(IdentityEngine(identity_provider))
    processor.add_middleware(IntentEngine(intent_classifier))
    processor.add_middleware(ContextEngine(context_builder))
    processor.add_middleware(PermissionEngine(permission_policy))
    processor.add_middleware(SessionEngine(session_store))

    # --- Phase 2 Setup ---
    memory_store = MockSQLMemoryStore()
    memory_pipeline = MemoryProcessingPipeline([
        ValidationMiddleware(),
        SecurityMiddleware(),
        StorageMiddleware(memory_store)
    ])
    memory_manager = MemoryManager(memory_store, memory_pipeline)

    print("--- Starting AIRA Phase 1 Processing ---")
    context = RequestContext(
        request_id=str(uuid.uuid4()),
        tenant_id="TENANT-1",
        raw_query="Update candidate joining status",
        metadata={"cognito_id": "mock-cognito-123"}
    )
    
    ai_request = await processor.execute(context)

    print("\n--- Starting AIRA Phase 2 Memory Pipeline ---")
    
    new_workflow_memory = WorkflowMemory(
        tenant_id=ai_request.tenant_id,
        owner_id=ai_request.identity.employee_id,
        creator_id=ai_request.identity.employee_id,
        source_system="RecruitmentModule",
        department="HR",
        workflow_name="Candidate Onboarding",
        current_state="Joining Pending",
        classification=MemoryClassification(
            category="Workflow",
            memory_type="StateUpdate",
            importance="High",
            visibility="Department"
        )
    )

    # SDK call
    saved_memory = await memory_manager.save(new_workflow_memory)
    
    print("\n--- Saved Enterprise Memory ---")
    print(saved_memory.model_dump_json(indent=2))

if __name__ == '__main__':
    asyncio.run(main())
