from aira.graph.manager.node_manager import NodeManager
from aira.graph.manager.relationship_manager import RelationshipManager
from aira.graph.manager.query_manager import QueryManager
from aira.graph.manager.snapshot_manager import SnapshotManager

class GraphManager:
    def __init__(self, node_manager: NodeManager, rel_manager: RelationshipManager, query_manager: QueryManager, snapshot_manager: SnapshotManager):
        self.node = node_manager
        self.relationship = rel_manager
        self.query = query_manager
        self.snapshot = snapshot_manager
