from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserMeResponse
from app.security import (
    create_access_token,
    create_oauth_state,
    decode_oauth_state,
    hash_password,
    verify_password,
)
from app.services import yandex_oauth

router = APIRouter(prefix="/auth", tags=["auth"])


def _is_local_host(host: str) -> bool:
    host = host.split(":")[0].lower()
    return host in {"localhost", "127.0.0.1"} or host.endswith(".local")


def _yandex_redirect_uri(request: Request, settings: Settings) -> str:
    """Redirect URI должен совпадать с записью в кабинете Яндекс OAuth."""
    forwarded_host = request.headers.get("x-forwarded-host")
    host = (forwarded_host or request.headers.get("host") or "").split(",")[0].strip()
    if _is_local_host(host):
        return settings.yandex_redirect_uri_local
    return settings.yandex_redirect_uri_prod


def _validate_return_to(return_to: str, settings: Settings) -> str:
    allowed = {origin.rstrip("/") for origin in settings.cors_origin_list}
    normalized = return_to.rstrip("/")
    if normalized not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid return URL")
    return return_to


def _unique_username(db: Session, base: str) -> str:
    candidate = base[:64]
    if not db.query(User).filter(User.username == candidate).first():
        return candidate
    for i in range(2, 1000):
        suffix = f"_{i}"
        trimmed = candidate[: 64 - len(suffix)] + suffix
        if not db.query(User).filter(User.username == trimmed).first():
            return trimmed
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not allocate username")


def _get_or_create_yandex_user(db: Session, profile: dict) -> User:
    yandex_id = yandex_oauth.profile_yandex_id(profile)
    user = db.query(User).filter(User.yandex_id == yandex_id).first()
    if user:
        email = yandex_oauth.profile_email(profile)
        if email and user.email != email:
            user.email = email
            db.commit()
        return user

    email = yandex_oauth.profile_email(profile)
    if email:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email:
            if by_email.yandex_id and by_email.yandex_id != yandex_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already linked to another account",
                )
            by_email.yandex_id = yandex_id
            db.commit()
            db.refresh(by_email)
            return by_email

    username = _unique_username(db, yandex_oauth.profile_username_base(profile))
    user = User(
        username=username,
        email=email,
        password_hash=None,
        yandex_id=yandex_id,
        is_active=False,
        is_superadmin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active and not user.is_superadmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending approval")
    token = create_access_token(user.username)
    return TokenResponse(access_token=token)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        is_active=False,
        is_superadmin=False,
    )
    db.add(user)
    db.commit()
    return {"message": "Registration successful. Wait for administrator approval."}


@router.get("/yandex/start")
def yandex_start(
    request: Request,
    return_to: Annotated[str, Query(description="URL фронта после успешного входа")],
    settings: Annotated[Settings, Depends(get_settings)],
):
    """Перенаправление на страницу входа Яндекс ID."""
    if not settings.yandex_client_id or not settings.yandex_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Yandex OAuth is not configured",
        )
    return_to = _validate_return_to(return_to, settings)
    redirect_uri = _yandex_redirect_uri(request, settings)
    state = create_oauth_state(return_to)
    url = yandex_oauth.build_authorize_url(
        client_id=settings.yandex_client_id,
        redirect_uri=redirect_uri,
        state=state,
    )
    return RedirectResponse(url, status_code=status.HTTP_302_FOUND)


@router.get("/yandex/callback")
async def yandex_callback(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
):
    """Callback Яндекс OAuth: создаёт/находит пользователя и возвращает JWT на фронт."""
    fallback = settings.cors_origin_list[0] if settings.cors_origin_list else "/"

    if error:
        params = urlencode({"oauth_error": error_description or error})
        return RedirectResponse(f"{fallback}/auth/callback?{params}", status_code=status.HTTP_302_FOUND)

    if not code or not state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth parameters")

    return_to = decode_oauth_state(state)
    if not return_to:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OAuth state")

    try:
        return_to = _validate_return_to(return_to, settings)
    except HTTPException:
        return_to = fallback

    redirect_uri = _yandex_redirect_uri(request, settings)
    try:
        token_payload = await yandex_oauth.exchange_code_for_token(
            client_id=settings.yandex_client_id,
            client_secret=settings.yandex_client_secret,
            code=code,
            redirect_uri=redirect_uri,
        )
        profile = await yandex_oauth.fetch_yandex_profile(token_payload["access_token"])
    except Exception as exc:
        params = urlencode({"oauth_error": "Не удалось войти через Яндекс"})
        return RedirectResponse(f"{return_to}/auth/callback?{params}", status_code=status.HTTP_302_FOUND)

    user = _get_or_create_yandex_user(db, profile)
    if not user.is_active and not user.is_superadmin:
        params = urlencode({"oauth_error": "Аккаунт ожидает подтверждения администратором"})
        return RedirectResponse(f"{return_to}/auth/callback?{params}", status_code=status.HTTP_302_FOUND)

    access_token = create_access_token(user.username)
    params = urlencode({"token": access_token})
    return RedirectResponse(f"{return_to}/auth/callback?{params}", status_code=status.HTTP_302_FOUND)


@router.get("/me", response_model=UserMeResponse)
def me(user: Annotated[User, Depends(get_current_user)]):
    return UserMeResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_superadmin=user.is_superadmin,
        is_active=user.is_active,
        permissions=[p.code for p in user.permissions],
    )
