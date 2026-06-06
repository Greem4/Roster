from datetime import date

from pydantic import BaseModel, Field


class VacationInterval(BaseModel):
    start: str = ""
    end: str = ""


class DutyMonthPreferences(BaseModel):
    """Пожелания сотрудника на один месяц графика (ключ YYYY-MM)."""

    canWork: str = ""
    avoidDays: list[int] = Field(default_factory=list)
    avoidWeekdays: list[int] = Field(default_factory=list)


class DutyPreferences(BaseModel):
    """Помесячные пожелания; поля canWork/avoid — устаревший формат."""

    canWork: str = ""
    avoid: str = ""
    months: dict[str, DutyMonthPreferences] = Field(default_factory=dict)


class DutyEmployeeResponse(BaseModel):
    id: int
    name: str
    title: str
    gender: str | None = None
    birth_date: date | None = None
    vacations: list[VacationInterval]
    preferences: DutyPreferences

    model_config = {"from_attributes": True}


class DutyEmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=16)
    gender: str | None = Field(default=None, pattern="^[MF]$")


class DutyEmployeePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    title: str | None = Field(default=None, min_length=1, max_length=16)
    gender: str | None = Field(default=None, pattern="^[MF]$")
    birth_date: date | None = None
    vacations: list[VacationInterval] | None = None
    preferences: DutyPreferences | None = None


class DutyMeResponse(BaseModel):
    duty_employee_id: int | None = None


class DutyLinkRequest(BaseModel):
    employee_id: int | None = None
