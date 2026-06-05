from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PayMonthlyUpsert(BaseModel):
    """Создание или замена всех сумм зарплаты за месяц."""

    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    amounts: list[Decimal] = Field(default_factory=list)
    currency: str = Field(default="RUB", min_length=3, max_length=3)


class PayMonthlyResponse(BaseModel):
    """Агрегат по месяцу: сумма и отдельные строки."""

    year: int
    month: int
    amount: Decimal
    amounts: list[Decimal]
    currency: str = "RUB"
    updated_at: datetime | None = None
