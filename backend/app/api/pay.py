from collections import defaultdict
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_permission
from app.models import PayMonthlyEntry, User
from app.pay.permissions import PERM_PAY_MANAGE, PERM_PAY_VIEW
from app.schemas.pay import PayMonthlyResponse, PayMonthlyUpsert

router = APIRouter(prefix="/pay", tags=["pay"])


def _aggregate_month(entries: list[PayMonthlyEntry]) -> PayMonthlyResponse:
    """Собрать ответ по списку строк одного месяца."""
    ordered = sorted(entries, key=lambda e: (e.sort_order, e.id))
    amounts = [e.amount for e in ordered]
    updated_at = max((e.updated_at for e in ordered), default=None)
    return PayMonthlyResponse(
        year=ordered[0].year,
        month=ordered[0].month,
        amount=sum(amounts, start=Decimal("0")),
        amounts=amounts,
        currency=ordered[0].currency,
        updated_at=updated_at,
    )


@router.get("/monthly", response_model=list[PayMonthlyResponse])
def list_monthly(
    year: Annotated[int, Query(ge=2000, le=2100)],
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_permission(PERM_PAY_VIEW))],
):
    """Все месяцы года, в которых есть хотя бы одна сохранённая сумма."""
    rows = (
        db.query(PayMonthlyEntry)
        .filter(PayMonthlyEntry.year == year)
        .order_by(PayMonthlyEntry.month.asc(), PayMonthlyEntry.sort_order.asc(), PayMonthlyEntry.id.asc())
        .all()
    )
    by_month: dict[int, list[PayMonthlyEntry]] = defaultdict(list)
    for row in rows:
        by_month[row.month].append(row)
    return [_aggregate_month(by_month[m]) for m in sorted(by_month)]


@router.put("/monthly", response_model=PayMonthlyResponse | None)
def upsert_monthly(
    body: PayMonthlyUpsert,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_permission(PERM_PAY_MANAGE))],
):
    """Заменить все суммы за месяц; пустой список очищает месяц."""
    currency = body.currency.upper()
    (
        db.query(PayMonthlyEntry)
        .filter(PayMonthlyEntry.year == body.year, PayMonthlyEntry.month == body.month)
        .delete(synchronize_session=False)
    )

    amounts_to_save = [a for a in body.amounts if a >= 0]
    if not amounts_to_save:
        db.commit()
        return None

    now_entries: list[PayMonthlyEntry] = []
    for sort_order, amount in enumerate(amounts_to_save):
        entry = PayMonthlyEntry(
            year=body.year,
            month=body.month,
            amount=amount,
            currency=currency,
            sort_order=sort_order,
            created_by_id=user.id,
        )
        db.add(entry)
        now_entries.append(entry)

    db.commit()
    for entry in now_entries:
        db.refresh(entry)
    return _aggregate_month(now_entries)
