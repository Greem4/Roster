"""Коды прав доступа модуля RosterRX.

Список лекарств — публичный (без auth). CRUD — через require_admin (users:manage).
Предупреждения /alerts/expiring — любой активный пользователь.
"""

PERM_RX_MANAGE = "users:manage"

ALL_RX_PERMISSIONS = (PERM_RX_MANAGE,)
