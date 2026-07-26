from typing import Optional, Dict, Any
from aira.identity.interfaces import IUserRepository, IRoleRepository

class MockUserRepository(IUserRepository):
    async def get_user_by_cognito_id(self, cognito_id: str) -> Optional[Dict[str, Any]]:
        if cognito_id == "mock-cognito-123":
            return {
                "employee_id": "EMP-001",
                "full_name": "John Doe",
                "email": "john.doe@intelexp.com",
                "department": "Engineering",
                "user_category": "Employee",
                "organization_hierarchy": ["CEO", "CTO", "VP Engineering", "John Doe"]
            }
        return None

class MockRoleRepository(IRoleRepository):
    async def get_user_roles(self, employee_id: str) -> list[str]:
        if employee_id == "EMP-001":
            return ["Developer", "Team Lead"]
        return []
