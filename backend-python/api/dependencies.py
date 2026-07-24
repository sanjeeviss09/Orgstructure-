from typing import AsyncGenerator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from core.config import settings
from db.session import AsyncSessionLocal
from core.security.schemas import TokenPayload
from core.exceptions import UnauthorizedException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise UnauthorizedException(detail="Could not validate credentials")
        return token_data
    except JWTError:
        raise UnauthorizedException(detail="Could not validate credentials")

async def get_current_active_user(current_user: Annotated[TokenPayload, Depends(get_current_user)]) -> TokenPayload:
    # Additional logic to check if user is active in DB
    return current_user
