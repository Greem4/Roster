"""Роли пользователей и уровни доступа."""

from sqlalchemy.orm import Session

from app.models import Permission, User
from app.module_permissions import MODULE_PERMISSION_CODES

ROLE_FOUNDER = "founder"
ROLE_SUPERADMIN = "superadmin"
ROLE_ADMIN = "admin"
ROLE_USER = "user"

PERM_MANAGE = "users:manage"


def _module_permissions(user: User) -> list[Permission]:
    """Модульные права, которые сохраняются при смене роли."""
    return [p for p in user.permissions if p.code in MODULE_PERMISSION_CODES]


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
    return actor.has_permission(PERM_MANAGE) and not target.is_superadmin


def roles_actor_may_assign(actor: User) -> list[str]:
    """Какие роли actor может выдать другому пользователю (не основатель)."""
    if actor.is_founder:
        return [ROLE_SUPERADMIN, ROLE_ADMIN, ROLE_USER]
    if actor.is_superadmin:
        return [ROLE_ADMIN, ROLE_USER]
    if actor.has_permission(PERM_MANAGE):
        return [ROLE_ADMIN, ROLE_USER]
    return []


def can_assign_role(actor: User, target: User, new_role: str) -> bool:
    """Можно ли назначить target роль new_role (основателя — только bootstrap POST /founder)."""
    if new_role == ROLE_FOUNDER:
        return False
    if new_role not in roles_actor_may_assign(actor):
        return False
    if not can_manage_user(actor, target):
        return False
    if target.is_founder:
        return False
    if target.is_superadmin and not actor.is_founder:
        return False
    return True


def apply_role(db: Session, user: User, role: str) -> None:
    """Применить роль; модульные права (Duty, CA, Pay) не сбрасываются."""
    manage = db.query(Permission).filter(Permission.code == PERM_MANAGE).first()
    module_perms = _module_permissions(user)
    user.is_founder = False
    if role == ROLE_SUPERADMIN:
        user.is_superadmin = True
        user.permissions = []
    elif role == ROLE_ADMIN:
        user.is_superadmin = False
        user.permissions = ([manage] if manage else []) + module_perms
    elif role == ROLE_USER:
        user.is_superadmin = False
        user.permissions = module_perms
    else:
        raise ValueError(f"Unknown role: {role}")


def apply_module_permissions(db: Session, user: User, module_codes: list[str]) -> None:
    """Обновить модульные права, не трогая users:manage у администратора."""
    if user.is_founder or user.is_superadmin:
        return
    role_perms = [p for p in user.permissions if p.code not in MODULE_PERMISSION_CODES]
    module_perms = db.query(Permission).filter(Permission.code.in_(module_codes)).all()
    user.permissions = role_perms + module_perms
