"""Обмен кода OAuth Яндекс ID на профиль пользователя."""

import re
from urllib.parse import urlencode

import httpx

YANDEX_AUTH_URL = "https://oauth.yandex.ru/authorize"
YANDEX_TOKEN_URL = "https://oauth.yandex.ru/token"
YANDEX_USER_URL = "https://login.yandex.ru/info"

# Права, выбранные в кабинете Яндекс OAuth для RosterRx
YANDEX_SCOPES = "login:email login:info login:avatar login:birthday login:phone"


def build_authorize_url(*, client_id: str, redirect_uri: str, state: str) -> str:
    """URL страницы согласия Яндекс ID."""
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": YANDEX_SCOPES,
        "force_confirm": "yes",
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
        response.raise_for_status()
        return response.json()


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
