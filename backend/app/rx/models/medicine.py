from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.rx.db import RxBase


class RxMedicine(RxBase):
    """Лекарство в реестре RosterRX. БД roster_rx, без FK на users."""

    __tablename__ = "medicines"
    __table_args__ = (UniqueConstraint("series", name="uq_medicines_series"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    series: Mapped[str] = mapped_column(String(128), nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_by_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
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
