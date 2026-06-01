"""Обмен кода OAuth Яндекс ID на профиль пользователя."""

import re
from urllib.parse import urlencode

import httpx

YANDEX_AUTH_URL = "https://oauth.yandex.ru/authorize"
YANDEX_TOKEN_URL = "https://oauth.yandex.ru/token"
YANDEX_USER_URL = "https://login.yandex.ru/info"

# Права из кабинета oauth.yandex.ru (должны совпадать 1:1, иначе invalid_scope)
YANDEX_SCOPES = "login:email login:info login:avatar login:birthday login:default_phone"


def oauth_user_error_message(*, error: str | None = None, error_description: str | None = None) -> str:
    """
    Понятное сообщение для пользователя после отказа или сбоя OAuth Яндекс.
    Не возвращаем сырой английский error_description с экрана Яндекса.
    """
    code = (error or "").strip().lower()
    if code == "access_denied":
        return (
            "Доступ не предоставлен: вы отменили вход или не выдали нужные права. "
            "Нажмите «Войти с Яндекс ID» ещё раз и подтвердите доступ для приложения."
        )
    if code == "invalid_scope":
        return (
            "Яндекс не выдал запрошенные права доступа. "
            "Попробуйте войти снова; если ошибка повторяется — сообщите администратору."
        )
    if code in {"invalid_request", "invalid_grant"}:
        return "Сессия входа через Яндекс устарела. Закройте окно и нажмите «Войти с Яндекс ID» снова."
    if code == "unauthorized_client":
        return "Вход через Яндекс временно недоступен. Сообщите администратору сайта."
    if code == "server_error":
        return "Сервис Яндекса временно недоступен. Попробуйте позже."
    if code == "temporarily_unavailable":
        return "Сервис Яндекса перегружен. Попробуйте войти через несколько минут."
    if error_description and any("\u0400" <= ch <= "\u04FF" for ch in error_description):
        return error_description
    if code:
        return "Не удалось войти через Яндекс. Попробуйте снова."
    return "Не удалось войти через Яндекс. Попробуйте снова."


def build_authorize_url(*, client_id: str, redirect_uri: str, state: str) -> str:
    """URL страницы согласия Яндекс ID."""
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": YANDEX_SCOPES,
    }
    return f"{YANDEX_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(
    *,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> dict:
    """Обмен authorization code на access_token."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            YANDEX_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.is_success:
            return response.json()
        try:
            payload = response.json()
        except ValueError:
            payload = {}
        raise ValueError(
            oauth_user_error_message(
                error=payload.get("error"),
                error_description=payload.get("error_description"),
            )
        )


async def fetch_yandex_profile(access_token: str) -> dict:
    """Профиль пользователя по access_token (API login.yandex.ru)."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            YANDEX_USER_URL,
            params={"format": "json"},
            headers={"Authorization": f"OAuth {access_token}"},
        )
        response.raise_for_status()
        return response.json()


def profile_yandex_id(profile: dict) -> str:
    yandex_id = profile.get("id")
    if yandex_id is None:
        raise ValueError("Yandex profile missing id")
    return str(yandex_id)


def profile_email(profile: dict) -> str | None:
    for key in ("default_email", "email"):
        value = profile.get(key)
        if value:
            return str(value)
    return None


YANDEX_AVATAR_SIZE = "islands-200"


def profile_avatar_url(profile: dict) -> str | None:
    """URL аватара Яндекс ID или None, если аватар не задан."""
    if profile.get("is_avatar_empty"):
        return None
    avatar_id = profile.get("default_avatar_id")
    if not avatar_id:
        return None
    return f"https://avatars.yandex.net/get-yapic/{avatar_id}/{YANDEX_AVATAR_SIZE}"


def profile_username_base(profile: dict) -> str:
    """Предпочтительный логин из ответа Яндекса."""
    for key in ("login", "default_login"):
        raw = profile.get(key)
        if not raw:
            continue
        cleaned = re.sub(r"[^\w.-]", "", str(raw), flags=re.ASCII)[:64]
        if len(cleaned) >= 3:
            return cleaned
    return f"yandex_{profile_yandex_id(profile)}"
