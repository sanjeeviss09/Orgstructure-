from typing import Protocol
from aira.contracts.request import RequestContext
from aira.contracts.context import EnterpriseContext

class IContextBuilder(Protocol):
    async def build(self, request_context: RequestContext) -> EnterpriseContext:
        ...
