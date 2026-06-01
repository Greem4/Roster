from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    email: EmailStr | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str | None = Field(default=None, min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class UserMeResponse(BaseModel):
    id: int
    username: str
    email: str | None
    avatar_url: str | None = None
    yandex_linked: bool = False
    is_superadmin: bool
    is_founder: bool
    role: str
    is_active: bool
    has_password: bool
    can_promote_founder: bool
    permissions: list[str]

    model_config = {"from_attributes": True}
