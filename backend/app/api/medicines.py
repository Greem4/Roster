from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_permission
from app.models import Medicine, User
from app.schemas.medicine import MedicineCreate, MedicineResponse, MedicineUpdate

router = APIRouter(prefix="/medicines", tags=["medicines"])

PERM_VIEW = "medicines:view"
PERM_EDIT = "medicines:edit"


def _days_until(expiry: date) -> int:
    return (expiry - date.today()).days


def _to_response(m: Medicine) -> MedicineResponse:
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
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(PERM_VIEW))],
    sort: str = Query(default="expiry_date"),
    expiring_within: int | None = None,
):
    q = db.query(Medicine)
    if expiring_within is not None:
        limit = date.today().toordinal() + expiring_within
        q = q.filter(Medicine.expiry_date <= date.fromordinal(limit))
    if sort == "expiry_date":
        q = q.order_by(Medicine.expiry_date.asc())
    elif sort == "name":
        q = q.order_by(Medicine.name.asc())
    else:
        q = q.order_by(Medicine.expiry_date.asc())
    return [_to_response(m) for m in q.all()]


@router.post("", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    body: MedicineCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_permission(PERM_EDIT))],
):
    medicine = Medicine(
        name=body.name,
        series=body.series,
        expiry_date=body.expiry_date,
        created_by_id=user.id,
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return _to_response(medicine)


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(
    medicine_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(PERM_VIEW))],
):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return _to_response(medicine)


@router.patch("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    body: MedicineUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(PERM_EDIT))],
):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if body.name is not None:
        medicine.name = body.name
    if body.series is not None:
        medicine.series = body.series
    if body.expiry_date is not None:
        medicine.expiry_date = body.expiry_date
    db.commit()
    db.refresh(medicine)
    return _to_response(medicine)


@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(PERM_EDIT))],
):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(medicine)
    db.commit()
