from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.database import engine

router = APIRouter()


def _db_status() -> tuple[str, str]:
    if not settings.DATABASE_URL:
        return "not_configured", "DATABASE_URL is not set"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return "connected", "Database reachable"
    except Exception as e:
        return "disconnected", str(e)[:200]


def _mailing_status() -> tuple[str, str]:
    if not settings.RESEND_API_KEY:
        return "not_configured", "RESEND_API_KEY is not set"
    return "configured", "API key present (send not probed)"


def _storage_status() -> tuple[str, str]:
    missing = []
    if not settings.AWS_ACCESS_KEY_ID:
        missing.append("AWS_ACCESS_KEY_ID")
    if not settings.AWS_SECRET_ACCESS_KEY:
        missing.append("AWS_SECRET_ACCESS_KEY")
    if not settings.AWS_BUCKET_NAME:
        missing.append("AWS_BUCKET_NAME")
    if missing:
        return "not_configured", f"Missing: {', '.join(missing)}"

    try:
        import boto3

        client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        client.head_bucket(Bucket=settings.AWS_BUCKET_NAME)
        return "connected", "Bucket reachable"
    except Exception as e:
        return "disconnected", str(e)[:200]


def _database_provider_hint() -> str:
    url = (settings.DATABASE_URL or "").lower()
    if "neon.tech" in url or "neon" in url:
        return "Neon (PostgreSQL)"
    if "postgresql" in url or "postgres" in url:
        return "PostgreSQL"
    if "sqlite" in url:
        return "SQLite"
    return "Database"


@router.get("/services")
def services_health():
    db_state, db_detail = _db_status()
    mail_state, mail_detail = _mailing_status()
    store_state, store_detail = _storage_status()

    return {
        "services": [
            {
                "id": "database",
                "role": "database",
                "name": _database_provider_hint(),
                "status": db_state,
                "detail": db_detail,
            },
            {
                "id": "mailing",
                "role": "mailing",
                "name": "Resend",
                "status": mail_state,
                "detail": mail_detail,
            },
            {
                "id": "storage",
                "role": "storage",
                "name": "AWS S3",
                "status": store_state,
                "detail": store_detail,
            },
        ]
    }
