from datetime import date, datetime

from pydantic import BaseModel, Field


class MedicineBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    series: str = Field(min_length=1, max_length=128)
    expiry_date: date


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    series: str | None = Field(default=None, min_length=1, max_length=128)
    expiry_date: date | None = None


class MedicineResponse(MedicineBase):
    id: int
    created_at: datetime
    updated_at: datetime
    days_until_expiry: int

    model_config = {"from_attributes": True}
