from typing import Protocol
from aira.contracts.request import RequestContext
from aira.contracts.permission import AuthorizationContext

class IPermissionPolicy(Protocol):
    async def evaluate(self, request_context: RequestContext) -> AuthorizationContext:
        ...
