from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_access_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    username = decode_access_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_active_user(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not user.is_active and not user.is_superadmin and not user.is_founder:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending approval")
    return user


def require_permission(code: str):
    def checker(user: Annotated[User, Depends(require_active_user)]) -> User:
        if not user.has_permission(code):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return user

    return checker


PERM_ADMIN = "users:manage"


def require_admin(user: Annotated[User, Depends(require_active_user)]) -> User:
    if user.is_founder or user.is_superadmin or user.has_permission(PERM_ADMIN):
        return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")


def require_founder(user: Annotated[User, Depends(require_active_user)]) -> User:
    if not user.is_founder:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Founder only")
    return user
