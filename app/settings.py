import os
from dataclasses import dataclass
from functools import lru_cache


def _parse_csv_env(name: str, default: str) -> tuple[str, ...]:
    raw = os.getenv(name, default).strip()
    if not raw:
        return tuple()
    return tuple(part.strip() for part in raw.split(",") if part.strip())


@dataclass(frozen=True)
class Settings:
    cors_origins: tuple[str, ...]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        cors_origins=_parse_csv_env("BACKEND_CORS_ORIGINS", "*"),
    )
