from datetime import date

from pydantic import BaseModel


class ExpiringMedicineAlert(BaseModel):
    id: int
    name: str
    series: str
    expiry_date: date
    days_until_expiry: int
    warn_threshold: int


class ExpiringAlertsResponse(BaseModel):
    items: list[ExpiringMedicineAlert]
    total: int
