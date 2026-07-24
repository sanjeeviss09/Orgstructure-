from typing import Protocol, Optional, Dict, Any
from aira.contracts.identity import IdentityContext

class IUserRepository(Protocol):
    async def get_user_by_cognito_id(self, cognito_id: str) -> Optional[Dict[str, Any]]:
        ...

class IRoleRepository(Protocol):
    async def get_user_roles(self, employee_id: str) -> list[str]:
        ...

class IIdentityProvider(Protocol):
    async def fetch_identity_context(self, cognito_id: str) -> IdentityContext:
        ...
