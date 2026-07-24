from aira.retrieval.stores.interfaces import IVectorStore

class HRRepository:
    """Isolated RAG repository for HR data."""
    def __init__(self, store: IVectorStore):
        self.store = store
