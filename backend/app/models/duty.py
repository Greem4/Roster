from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

DEFAULT_VACATIONS = [{"start": "", "end": ""}, {"start": "", "end": ""}]
DEFAULT_PREFERENCES = {"months": {}}


class DutyEmployee(Base):
    """Строка справочника графика ОСМП: ФИО, должность, отпуска и пожелания."""

    __tablename__ = "duty_employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(16), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(1), nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    vacations: Mapped[list] = mapped_column(JSON, nullable=False, default=lambda: list(DEFAULT_VACATIONS))
    preferences: Mapped[dict] = mapped_column(JSON, nullable=False, default=lambda: dict(DEFAULT_PREFERENCES))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
