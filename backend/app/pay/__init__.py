"""Домен RosterPay (права, константы). API — app.api.pay, модели — app.models.pay."""

from app.pay.permissions import ALL_PAY_PERMISSIONS, PERM_PAY_MANAGE, PERM_PAY_VIEW

__all__ = ["PERM_PAY_VIEW", "PERM_PAY_MANAGE", "ALL_PAY_PERMISSIONS"]
