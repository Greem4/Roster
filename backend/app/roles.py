"""Роли пользователей и уровни доступа."""

from app.models import User

ROLE_FOUNDER = "founder"
ROLE_SUPERADMIN = "superadmin"
ROLE_ADMIN = "admin"
ROLE_USER = "user"


def user_role(user: User) -> str:
    """Код роли для API и UI (приоритет: основатель → супер-админ → админ → пользователь)."""
    if user.is_founder:
        return ROLE_FOUNDER
    if user.is_superadmin:
        return ROLE_SUPERADMIN
    if any(p.code == "users:manage" for p in user.permissions):
        return ROLE_ADMIN
    return ROLE_USER


def can_promote_founder(actor: User, db_has_founder: bool) -> bool:
    """Bootstrap-супер-админ может один раз назначить основателя."""
    return actor.is_superadmin and not actor.is_founder and not db_has_founder


def can_manage_user(actor: User, target: User) -> bool:
    """Может ли actor редактировать target через PATCH /users."""
    if actor.id == target.id:
        return True
    if target.is_founder:
        return False
    if actor.is_founder:
        return True
    if target.is_superadmin:
        return False
    if actor.is_superadmin:
        return True
    return actor.has_permission("users:manage") and not target.is_superadmin
