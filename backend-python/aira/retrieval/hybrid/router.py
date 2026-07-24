from aira.retrieval.stores.interfaces import IVectorStore
from aira.retrieval.repositories.hr import HRRepository
from aira.retrieval.repositories.policy import PolicyRepository

class DomainRouter:
    def __init__(self, store: IVectorStore):
        # In a real app, these repositories might have independent stores
        self.hr_repo = HRRepository(store)
        self.policy_repo = PolicyRepository(store)

    def route(self, query: str) -> IVectorStore:
        """Determines which repository to query based on intent/metadata."""
        if "policy" in query.lower() or "procedure" in query.lower():
            return self.policy_repo.store
        # Fallback to general store
        return self.hr_repo.store
