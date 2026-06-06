from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_active_user, require_founder, require_permission
from app.duty.permissions import PERM_DUTY_VIEW
from app.models import DutyEmployee, User
from app.models.duty import DEFAULT_PREFERENCES, DEFAULT_VACATIONS
from app.schemas.duty import (
    DutyEmployeeCreate,
    DutyEmployeePatch,
    DutyEmployeeResponse,
    DutyLinkRequest,
    DutyMeResponse,
)

router = APIRouter(prefix="/duty", tags=["duty"])

VALID_TITLES = frozenset({"doctor", "nurse", "medbrother", "paramedic"})


def _employee_to_response(row: DutyEmployee) -> DutyEmployeeResponse:
    return DutyEmployeeResponse.model_validate(row)


def _validate_title(title: str) -> str:
    if title not in VALID_TITLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid duty title")
    return title


def _can_edit_profile(user: User, employee_id: int) -> bool:
    return user.is_founder or user.duty_employee_id == employee_id


@router.get("/employees", response_model=list[DutyEmployeeResponse])
def list_employees(
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_permission(PERM_DUTY_VIEW))],
):
    """Справочник сотрудников графика ОСМП."""
    rows = (
        db.query(DutyEmployee)
        .order_by(DutyEmployee.sort_order.asc(), DutyEmployee.id.asc())
        .all()
    )
    return [_employee_to_response(row) for row in rows]


@router.post("/employees", response_model=DutyEmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    body: DutyEmployeeCreate,
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_founder)],
):
    """Добавление строки в справочник — только основатель."""
    title = _validate_title(body.title)
    max_order = db.query(DutyEmployee.sort_order).order_by(DutyEmployee.sort_order.desc()).first()
    sort_order = (max_order[0] + 1) if max_order else 0
    row = DutyEmployee(
        name=body.name.strip(),
        title=title,
        gender=body.gender,
        vacations=list(DEFAULT_VACATIONS),
        preferences=dict(DEFAULT_PREFERENCES),
        sort_order=sort_order,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _employee_to_response(row)


@router.patch("/employees/{employee_id}", response_model=DutyEmployeeResponse)
def patch_employee(
    employee_id: int,
    body: DutyEmployeePatch,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_permission(PERM_DUTY_VIEW))],
):
    """Частичное обновление: профиль — своя строка или основатель; отпуска/пожелания — все с duty:view."""
    row = db.get(DutyEmployee, employee_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    payload = body.model_dump(exclude_unset=True)
    if not payload:
        return _employee_to_response(row)

    if "name" in payload and not user.is_founder:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only founder can rename")

    if ("title" in payload or "gender" in payload) and not _can_edit_profile(user, employee_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit this profile")

    if "title" in payload:
        row.title = _validate_title(payload["title"])
    if "gender" in payload:
        row.gender = payload["gender"]
    if "name" in payload:
        row.name = payload["name"].strip()
    if "vacations" in payload:
        vacations = payload["vacations"]
        if len(vacations) != 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Expected two vacation intervals")
        row.vacations = [v.model_dump() if hasattr(v, "model_dump") else v for v in vacations]
    if "preferences" in payload:
        pref = payload["preferences"]
        row.preferences = pref.model_dump() if hasattr(pref, "model_dump") else pref

    db.commit()
    db.refresh(row)
    return _employee_to_response(row)


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(require_founder)],
):
    """Исключение из справочника — только основатель."""
    row = db.get(DutyEmployee, employee_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    db.query(User).filter(User.duty_employee_id == employee_id).update({"duty_employee_id": None})
    db.delete(row)
    db.commit()


@router.get("/me", response_model=DutyMeResponse)
def get_me(
    user: Annotated[User, Depends(require_permission(PERM_DUTY_VIEW))],
):
    """Привязка текущего пользователя к строке графика."""
    return DutyMeResponse(duty_employee_id=user.duty_employee_id)


@router.put("/me/link", response_model=DutyMeResponse)
def link_me(
    body: DutyLinkRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_permission(PERM_DUTY_VIEW))],
):
    """Выбрать свою строку в графике (один пользователь на строку)."""
    if body.employee_id is not None:
        row = db.get(DutyEmployee, body.employee_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        taken = (
            db.query(User)
            .filter(User.duty_employee_id == body.employee_id, User.id != user.id)
            .first()
        )
        if taken:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Эта строка уже привязана к другому пользователю",
            )
    user.duty_employee_id = body.employee_id
    db.commit()
    db.refresh(user)
    return DutyMeResponse(duty_employee_id=user.duty_employee_id)
