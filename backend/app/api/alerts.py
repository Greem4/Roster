"""HTTP API модуля RosterRX: предупреждения по срокам годности. Домен — app.rx."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.rx.db import get_rx_db
from app.deps import require_active_user
from app.models import User
from app.rx.models.medicine import RxMedicine
from app.schemas.alert import ExpiringAlertsResponse, ExpiringMedicineAlert

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/expiring", response_model=ExpiringAlertsResponse)
def expiring_alerts(
    db: Annotated[Session, Depends(get_rx_db)],
    _: Annotated[User, Depends(require_active_user)],
    days: int | None = Query(default=None, description="Max days until expiry; default = max warn threshold"),
):
    settings = get_settings()
    max_days = days if days is not None else max(settings.warn_days_list, default=30)
    today = date.today()
    items: list[ExpiringMedicineAlert] = []

    medicines = (
        db.query(RxMedicine)
        .filter(RxMedicine.expiry_date <= date.fromordinal(today.toordinal() + max_days))
        .order_by(RxMedicine.expiry_date.asc())
        .all()
    )

    for m in medicines:
        days_left = (m.expiry_date - today).days
        threshold = next((w for w in sorted(settings.warn_days_list) if days_left <= w), max_days)
        items.append(
            ExpiringMedicineAlert(
                id=m.id,
                name=m.name,
                series=m.series,
                expiry_date=m.expiry_date,
                days_until_expiry=days_left,
                warn_threshold=threshold,
            )
        )

    return ExpiringAlertsResponse(items=items, total=len(items))
