"""HTTP API модуля RosterRX: CRUD лекарств. Домен — app.rx, модель Medicine."""

from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.rx.db import get_rx_db
from app.deps import require_admin
from app.models import User
from app.rx.models.medicine import RxMedicine
from app.schemas.medicine import MedicineCreate, MedicineResponse, MedicineUpdate

router = APIRouter(prefix="/medicines", tags=["medicines"])


def _normalize_series(series: str) -> str:
    """Серия партии — уникальный ключ позиции в реестре."""
    return series.strip()[:128]


def _series_conflict(db: Session, series: str, exclude_id: int | None = None) -> str | None:
    """Текст 409, если серия занята; удалённые тоже держат серию — их восстанавливают."""
    q = db.query(RxMedicine.deleted_at).filter(RxMedicine.series == series)
    if exclude_id is not None:
        q = q.filter(RxMedicine.id != exclude_id)
    row = q.first()
    if row is None:
        return None
    if row.deleted_at is not None:
        return "Лекарство с такой серией есть в удалённых — восстановите его"
    return "Лекарство с такой серией уже есть"

def _days_until(expiry: date) -> int:
    return (expiry - date.today()).days


def _to_response(m: RxMedicine) -> MedicineResponse:
    return MedicineResponse(
        id=m.id,
        name=m.name,
        series=m.series,
        expiry_date=m.expiry_date,
        created_at=m.created_at,
        updated_at=m.updated_at,
        deleted_at=m.deleted_at,
        days_until_expiry=_days_until(m.expiry_date),
    )


@router.get("", response_model=list[MedicineResponse])
def list_medicines(
    db: Annotated[Session, Depends(get_rx_db)],
    sort: str = Query(default="expiry_date"),
    expiring_within: int | None = None,
    deleted: bool = Query(default=False, description="true — вкладка «Удалённые»"),
):
    q = db.query(RxMedicine)
    if deleted:
        q = q.filter(RxMedicine.deleted_at.is_not(None))
    else:
        q = q.filter(RxMedicine.deleted_at.is_(None))
    if expiring_within is not None:
        limit = date.today().toordinal() + expiring_within
        q = q.filter(RxMedicine.expiry_date <= date.fromordinal(limit))
    if sort == "expiry_date":
        q = q.order_by(RxMedicine.expiry_date.asc())
    elif sort == "name":
        q = q.order_by(RxMedicine.name.asc())
    else:
        q = q.order_by(RxMedicine.expiry_date.asc())
    return [_to_response(m) for m in q.all()]


@router.post("", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    body: MedicineCreate,
    db: Annotated[Session, Depends(get_rx_db)],
    user: Annotated[User, Depends(require_admin)],
):
    series = _normalize_series(body.series)
    conflict = _series_conflict(db, series)
    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict)
    medicine = RxMedicine(
        name=body.name.strip()[:255],
        series=series,
        expiry_date=body.expiry_date,
        created_by_id=user.id,
    )
    db.add(medicine)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Лекарство с такой серией уже есть",
        ) from exc
    db.refresh(medicine)
    return _to_response(medicine)


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(
    medicine_id: int,
    db: Annotated[Session, Depends(get_rx_db)],
):
    medicine = db.get(RxMedicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return _to_response(medicine)


@router.patch("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    body: MedicineUpdate,
    db: Annotated[Session, Depends(get_rx_db)],
    _: Annotated[User, Depends(require_admin)],
):
    medicine = db.get(RxMedicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if body.name is not None:
        medicine.name = body.name.strip()[:255]
    if body.series is not None:
        series = _normalize_series(body.series)
        conflict = _series_conflict(db, series, exclude_id=medicine.id)
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict)
        medicine.series = series
    if body.expiry_date is not None:
        medicine.expiry_date = body.expiry_date
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Лекарство с такой серией уже есть",
        ) from exc
    db.refresh(medicine)
    return _to_response(medicine)


@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int,
    db: Annotated[Session, Depends(get_rx_db)],
    _: Annotated[User, Depends(require_admin)],
):
    """Мягкое удаление: позиция уходит во вкладку «Удалённые», строка в БД остаётся."""
    medicine = db.get(RxMedicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if medicine.deleted_at is None:
        medicine.deleted_at = datetime.now(timezone.utc)
        db.commit()


@router.post("/{medicine_id}/restore", response_model=MedicineResponse)
def restore_medicine(
    medicine_id: int,
    db: Annotated[Session, Depends(get_rx_db)],
    _: Annotated[User, Depends(require_admin)],
):
    medicine = db.get(RxMedicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if medicine.deleted_at is not None:
        medicine.deleted_at = None
        db.commit()
        db.refresh(medicine)
    return _to_response(medicine)
