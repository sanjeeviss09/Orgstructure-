import asyncio
from pprint import pprint

from aira.graph.core.taxonomy import Employee, Manager
from aira.graph.contracts.base import GraphRelationship
from aira.graph.providers.networkx_store import NetworkXGraphStore

from aira.graph.resolver.nodes import NodeResolver
from aira.graph.resolver.relationships import RelationshipResolver
from aira.graph.validator.integrity import GraphValidator
from aira.graph.pipeline.middlewares import GraphProcessingPipeline, ResolvingMiddleware, ValidationMiddleware, StorageMiddleware

from aira.graph.manager.node_manager import NodeManager
from aira.graph.manager.relationship_manager import RelationshipManager
from aira.graph.manager.query_manager import QueryManager
from aira.graph.manager.snapshot_manager import SnapshotManager
from aira.graph.manager.sdk import GraphManager

async def main():
    store = NetworkXGraphStore()
    node_resolver = NodeResolver(store)
    rel_resolver = RelationshipResolver(store)
    validator = GraphValidator(store)

    pipeline = GraphProcessingPipeline([
        ResolvingMiddleware(node_resolver, rel_resolver),
        ValidationMiddleware(validator),
        StorageMiddleware(store)
    ])

    manager = GraphManager(
        NodeManager(pipeline),
        RelationshipManager(pipeline),
        QueryManager(store),
        SnapshotManager(store)
    )

    print("--- 1. Creating Nodes ---")
    ceo = Employee(node_id="EMP-CEO", tenant_id="T1", properties={"name": "Alice CEO"})
    vp = Manager(node_id="EMP-VP", tenant_id="T1", properties={"name": "Bob VP"})

    await manager.node.create(ceo)
    await manager.node.create(vp)
    
    # Simulate an update (Resolver prevents duplicate, bumps version)
    print("\n--- 2. Updating Node (Testing Resolver) ---")
    vp_updated = Manager(node_id="EMP-VP", tenant_id="T1", properties={"name": "Bob VP", "department": "Engineering"})
    await manager.node.create(vp_updated)  # SDK uses create() which resolves to update

    print("\n--- 3. Creating Relationship ---")
    rel = GraphRelationship(
        tenant_id="T1",
        source_id="EMP-VP",
        target_id="EMP-CEO",
        type="REPORTS_TO"
    )
    await manager.relationship.link(rel)

    print("\n--- 4. Traversing Graph ---")
    neighbors = await manager.query.traverse("EMP-VP")
    for n in neighbors:
        print(f"EMP-VP connects to: {n.node_id} ({n.properties.get('name')})")
        
    print("\n--- Graph Store State ---")
    print(f"Nodes in Graph: {len(await store.get_all_nodes())}")
    print(f"VP Version: {(await store.get_node('EMP-VP')).version}")

if __name__ == '__main__':
    asyncio.run(main())
