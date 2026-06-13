"""Подключение к изолированной БД RosterRX (roster_rx)."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

rx_engine = create_engine(settings.rx_database_url, pool_pre_ping=True)
RxSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=rx_engine)


class RxBase(DeclarativeBase):
    pass


def get_rx_db():
    """Сессия SQLAlchemy для таблиц модуля RX (БД roster_rx)."""
    db = RxSessionLocal()
    try:
        yield db
    finally:
        db.close()
