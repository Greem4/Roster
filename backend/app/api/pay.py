from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_permission
from app.models import PayAccount, PayMonthlyTotal, User
from app.pay.permissions import PERM_PAY_MANAGE, PERM_PAY_VIEW
from app.schemas.pay import (
    PayAccountCreate,
    PayAccountResponse,
    PayMonthlyResponse,
    PayMonthlyUpsert,
    PaySummaryResponse,
)

router = APIRouter(prefix="/pay", tags=["pay"])


def _to_response(account: PayAccount) -> PayAccountResponse:
    return PayAccountResponse.model_validate(account)


@router.get("/summary", response_model=PaySummaryResponse)
def pay_summary(
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_permission(PERM_PAY_VIEW))],
):
    accounts = db.query(PayAccount).all()
    total = sum((a.balance for a in accounts), Decimal("0"))
    currency = accounts[0].currency if accounts else "RUB"
    return PaySummaryResponse(account_count=len(accounts), total_balance=total, currency=currency)


@router.get("/accounts", response_model=list[PayAccountResponse])
def list_accounts(
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_permission(PERM_PAY_VIEW))],
):
    rows = db.query(PayAccount).order_by(PayAccount.name.asc()).all()
    return [_to_response(a) for a in rows]


@router.post("/accounts", response_model=PayAccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    body: PayAccountCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_permission(PERM_PAY_MANAGE))],
):
    account = PayAccount(
        name=body.name,
        note=body.note,
        balance=body.balance,
        currency=body.currency.upper(),
        created_by_id=user.id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _to_response(account)


def _monthly_to_response(row: PayMonthlyTotal) -> PayMonthlyResponse:
    return PayMonthlyResponse.model_validate(row)


@router.get("/monthly", response_model=list[PayMonthlyResponse])
def list_monthly(
    year: Annotated[int, Query(ge=2000, le=2100)],
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_permission(PERM_PAY_VIEW))],
):
    """Все сохранённые суммы за календарный год (для формы и графика)."""
    rows = (
        db.query(PayMonthlyTotal)
        .filter(PayMonthlyTotal.year == year)
        .order_by(PayMonthlyTotal.month.asc())
        .all()
    )
    return [_monthly_to_response(r) for r in rows]


@router.put("/monthly", response_model=PayMonthlyResponse)
def upsert_monthly(
    body: PayMonthlyUpsert,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_permission(PERM_PAY_MANAGE))],
):
    """Сохранить сумму за месяц (одна запись на пару год+месяц)."""
    row = (
        db.query(PayMonthlyTotal)
        .filter(PayMonthlyTotal.year == body.year, PayMonthlyTotal.month == body.month)
        .first()
    )
    if row is None:
        row = PayMonthlyTotal(
            year=body.year,
            month=body.month,
            amount=body.amount,
            currency=body.currency.upper(),
            created_by_id=user.id,
        )
        db.add(row)
    else:
        row.amount = body.amount
        row.currency = body.currency.upper()
    db.commit()
    db.refresh(row)
    return _monthly_to_response(row)
