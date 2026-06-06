from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_active_user, require_founder
from app.models import Permission, User
from app.roles import apply_module_permissions, apply_role, can_assign_role, can_manage_user, user_role
from app.module_permissions import module_permission_codes
from app.schemas.user import UserListItem, UserUpdateRequest
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

PERM_MANAGE = "users:manage"


def _user_item(user: User) -> UserListItem:
    return UserListItem(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        is_superadmin=user.is_superadmin,
        is_founder=user.is_founder,
        role=user_role(user),
        is_active=user.is_active,
        permissions=[p.code for p in user.permissions],
    )


def _require_can_list(current: User) -> None:
    if current.is_founder or current.is_superadmin or current.has_permission(PERM_MANAGE):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


@router.get("", response_model=list[UserListItem])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_active_user)],
):
    _require_can_list(current)
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_user_item(u) for u in users]


@router.patch("/{user_id}", response_model=UserListItem)
def update_user(
    user_id: int,
    body: UserUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_active_user)],
):
    _require_can_list(current)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if not can_manage_user(current, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify this user")
    if body.role is not None and body.permissions is not None:
        invalid = set(body.permissions) - set(module_permission_codes(body.permissions))
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specify either role or permissions, not both",
            )
    if body.permissions is not None and (user.is_founder or user.is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change permissions for this role",
        )

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.email is not None:
        user.email = body.email
    if body.password:
        user.password_hash = hash_password(body.password)
    if body.role is not None:
        if not can_assign_role(current, user, body.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign this role",
            )
        apply_role(db, user, body.role)
    if body.permissions is not None:
        apply_module_permissions(db, user, module_permission_codes(body.permissions))

    db.commit()
    db.refresh(user)
    return _user_item(user)


@router.post("/{user_id}/founder", response_model=UserListItem)
def promote_to_founder(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_active_user)],
):
    """Назначить основателя (только bootstrap-супер-админ, один раз в системе)."""
    if not current.is_superadmin or current.is_founder:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only bootstrap superadmin")
    if db.query(User).filter(User.is_founder.is_(True)).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Founder already exists")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if user.is_founder:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already founder")

    all_perms = db.query(Permission).all()
    user.is_founder = True
    user.is_active = True
    user.permissions = all_perms
    db.commit()
    db.refresh(user)
    return _user_item(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_founder)],
):
    """Удалить учётную запись (только основатель; нельзя удалить себя или другого основателя)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if user.id == current.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")
    if user.is_founder:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete founder")
    db.delete(user)
    db.commit()
