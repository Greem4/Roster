"""HTTP API модуля RosterRX: CRUD лекарств. Домен — app.rx, модель Medicine."""

from datetime import date
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


def _series_taken(db: Session, series: str, exclude_id: int | None = None) -> bool:
    q = db.query(RxMedicine.id).filter(RxMedicine.series == series)
    if exclude_id is not None:
        q = q.filter(Medicine.id != exclude_id)
    return q.first() is not None

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
        days_until_expiry=_days_until(m.expiry_date),
    )


@router.get("", response_model=list[MedicineResponse])
def list_medicines(
    db: Annotated[Session, Depends(get_rx_db)],
    sort: str = Query(default="expiry_date"),
    expiring_within: int | None = None,
):
    q = db.query(RxMedicine)
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
    if _series_taken(db, series):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Лекарство с такой серией уже есть",
        )
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
        if _series_taken(db, series, exclude_id=medicine.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Лекарство с такой серией уже есть",
            )
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
    medicine = db.get(RxMedicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(medicine)
    db.commit()
