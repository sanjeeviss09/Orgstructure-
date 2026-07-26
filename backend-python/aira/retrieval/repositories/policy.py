from aira.retrieval.stores.interfaces import IVectorStore

class PolicyRepository:
    """Isolated RAG repository for Corporate Policies."""
    def __init__(self, store: IVectorStore):
        self.store = store
