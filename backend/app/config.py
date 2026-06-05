from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://roster:roster@localhost:5432/roster"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_expire_minutes: int = 43_200  # 30 суток
    cors_origins: str = "http://localhost:5173"
    expiry_warn_days: str = "30,14,7"

    yandex_client_id: str = ""
    yandex_client_secret: str = ""
    yandex_redirect_uri_local: str = "http://localhost:5173/api/auth/yandex/callback"
    yandex_redirect_uri_prod: str = "https://medicine.greemlab.ru/api/auth/yandex/callback"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def warn_days_list(self) -> list[int]:
        return [int(d.strip()) for d in self.expiry_warn_days.split(",") if d.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
