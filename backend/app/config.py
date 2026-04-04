from dotenv import load_dotenv
import os

load_dotenv()


class Settings:

    PROJECT_NAME = "Event Platform"

    DATABASE_URL = os.getenv(
        "DATABASE_URL"
    )

    SECRET_KEY = os.getenv(
        "SECRET_KEY"
    )

    RESEND_API_KEY = os.getenv(
        "RESEND_API_KEY"
    )


    AWS_ACCESS_KEY_ID = os.getenv(
        "AWS_ACCESS_KEY_ID"
    )

    AWS_SECRET_ACCESS_KEY = os.getenv(
        "AWS_SECRET_ACCESS_KEY"
    )

    AWS_BUCKET_NAME = os.getenv(
        "AWS_BUCKET_NAME"
    )

    AWS_REGION = os.getenv(
        "AWS_REGION"
    )


settings = Settings()