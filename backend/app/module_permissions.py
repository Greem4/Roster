"""Права доступа к модулям Roster (Duty, CA, Pay)."""

PERM_DUTY_VIEW = "duty:view"
PERM_CA_VIEW = "ca:view"
PERM_PAY_VIEW = "pay:view"
PERM_PAY_MANAGE = "pay:manage"

MODULE_PERMISSION_CODES = frozenset(
    {
        PERM_DUTY_VIEW,
        PERM_CA_VIEW,
        PERM_PAY_VIEW,
        PERM_PAY_MANAGE,
    }
)

ALL_MODULE_PERMISSIONS = (
    PERM_DUTY_VIEW,
    PERM_CA_VIEW,
    PERM_PAY_VIEW,
    PERM_PAY_MANAGE,
)


def module_permission_codes(codes: list[str]) -> list[str]:
    """Оставить только коды модульных прав."""
    return [c for c in codes if c in MODULE_PERMISSION_CODES]


def role_permission_codes(codes: list[str]) -> list[str]:
    """Права роли (не модульные), например users:manage."""
    return [c for c in codes if c not in MODULE_PERMISSION_CODES]
