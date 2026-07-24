from aira.identity.interfaces import IIdentityProvider, IUserRepository, IRoleRepository
from aira.contracts.identity import IdentityContext

class DefaultIdentityProvider(IIdentityProvider):
    def __init__(self, user_repo: IUserRepository, role_repo: IRoleRepository):
        self.user_repo = user_repo
        self.role_repo = role_repo

    async def fetch_identity_context(self, cognito_id: str) -> IdentityContext:
        user_data = await self.user_repo.get_user_by_cognito_id(cognito_id)
        if not user_data:
            return IdentityContext(cognito_user_id=cognito_id, user_category="Unknown")

        roles = await self.role_repo.get_user_roles(user_data["employee_id"])

        return IdentityContext(
            cognito_user_id=cognito_id,
            employee_id=user_data.get("employee_id"),
            full_name=user_data.get("full_name"),
            email=user_data.get("email"),
            department=user_data.get("department"),
            user_category=user_data.get("user_category"),
            organization_hierarchy=user_data.get("organization_hierarchy", []),
            active_roles=roles
        )
