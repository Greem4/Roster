from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_permission
from app.models import PayAccount, User
from app.pay.permissions import PERM_PAY_MANAGE, PERM_PAY_VIEW
from app.schemas.pay import PayAccountCreate, PayAccountResponse, PaySummaryResponse

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
