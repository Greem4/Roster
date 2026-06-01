from typing import Literal

from pydantic import BaseModel, EmailStr, Field

RoleAssignCode = Literal["superadmin", "admin", "user"]


class UserListItem(BaseModel):
    id: int
    username: str
    email: str | None
    avatar_url: str | None = None
    is_superadmin: bool
    is_founder: bool
    role: str
    is_active: bool
    permissions: list[str]

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    is_active: bool | None = None
    permissions: list[str] | None = None
    role: RoleAssignCode | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)
    email: EmailStr | None = None
