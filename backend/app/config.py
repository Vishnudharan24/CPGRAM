from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./cpgrams_demo.db"
    jwt_secret: str = "dev-secret"
    jwt_expire_minutes: int = 1440
    frontend_origin: str = "http://localhost:5173"

    @field_validator("database_url")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v and v.startswith("postgresql://") and not v.startswith("postgresql+psycopg://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
