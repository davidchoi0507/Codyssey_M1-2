import os
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드 (루트 및 backend 폴더 모두 감지)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env")

class Settings:
    PROJECT_NAME: str = "SoundPulse AI - Global Streaming Intelligence"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # API Keys & Credentials
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_BASE_URL: str = os.getenv("ANTHROPIC_BASE_URL", "https://copa.codyssey.kr/v1")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4")

    # Firebase
    # JSON 파일 경로 또는 서비스 계정 JSON 문자열
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    FIREBASE_SERVICE_ACCOUNT_JSON: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:5500,http://localhost:8000,http://127.0.0.1:5500,http://127.0.0.1:8000,https://*.vercel.app"
        ).split(",")
        if origin.strip()
    ]

settings = Settings()

