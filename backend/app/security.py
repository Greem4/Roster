from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None


def create_oauth_state(return_to: str) -> str:
    """Короткоживущий state для OAuth (куда вернуть браузер после входа)."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {"return_to": return_to, "exp": expire, "typ": "oauth_state"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_oauth_state(state: str) -> str | None:
    settings = get_settings()
    try:
        payload = jwt.decode(state, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("typ") != "oauth_state":
            return None
        return_to = payload.get("return_to")
        return str(return_to) if return_to else None
    except JWTError:
        return None
