from fastapi import HTTPException, status

class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code

class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, "NOT_FOUND")

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, "UNAUTHORIZED")
        self.headers = {"WWW-Authenticate": "Bearer"}

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, "FORBIDDEN")

class BusinessRuleException(AppException):
    def __init__(self, detail: str = "Business rule violation"):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, "BUSINESS_RULE_VIOLATION")
