from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PayAccountBase(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    note: str | None = Field(default=None, max_length=2000)
    balance: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2, max_digits=14)
    currency: str = Field(default="RUB", min_length=3, max_length=3)


class PayAccountCreate(PayAccountBase):
    pass


class PayAccountResponse(PayAccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaySummaryResponse(BaseModel):
    """Сводка по всем счетам кабинета."""

    account_count: int
    total_balance: Decimal
    currency: str = "RUB"
