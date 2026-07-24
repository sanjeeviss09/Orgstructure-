from typing import Optional, List
from pydantic import BaseModel

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    exp: Optional[int] = None

class RBAC:
    SUPER_ADMIN = "Super Administrator"
    HR = "HR"
    RECRUITER = "Recruiter"
    HIRING_MANAGER = "Hiring Manager"
    DEPARTMENT_HEAD = "Department Head"
    EMPLOYEE = "Employee"
    CANDIDATE = "Candidate"
    FINANCE = "Finance"
    EXECUTIVE = "Executive"
    VISITOR = "Visitor"

    @classmethod
    def get_all_roles(cls) -> List[str]:
        return [
            cls.SUPER_ADMIN, cls.HR, cls.RECRUITER, cls.HIRING_MANAGER,
            cls.DEPARTMENT_HEAD, cls.EMPLOYEE, cls.CANDIDATE, cls.FINANCE,
            cls.EXECUTIVE, cls.VISITOR
        ]
