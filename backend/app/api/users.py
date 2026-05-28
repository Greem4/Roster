from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_permission
from app.models import Permission, User
from app.schemas.user import UserListItem, UserUpdateRequest
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

PERM_MANAGE = "users:manage"


def _user_item(user: User) -> UserListItem:
    return UserListItem(
        id=user.id,
        username=user.username,
        email=user.email,
        is_superadmin=user.is_superadmin,
        is_active=user.is_active,
        permissions=[p.code for p in user.permissions],
    )


@router.get("", response_model=list[UserListItem])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(PERM_MANAGE))],
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_user_item(u) for u in users]


@router.patch("/{user_id}", response_model=UserListItem)
def update_user(
    user_id: int,
    body: UserUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_permission(PERM_MANAGE))],
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if user.is_superadmin and user.id != current.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify superadmin")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.email is not None:
        user.email = body.email
    if body.password:
        user.password_hash = hash_password(body.password)
    if body.permissions is not None:
        perms = db.query(Permission).filter(Permission.code.in_(body.permissions)).all()
        user.permissions = perms

    db.commit()
    db.refresh(user)
    return _user_item(user)
