from jose import jwt
import datetime

from app.config import settings


SECRET_KEY = settings.SECRET_KEY

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_HOURS = 24


def create_access_token(data: dict):

    expire = datetime.datetime.utcnow() + \
        datetime.timedelta(
            hours=ACCESS_TOKEN_EXPIRE_HOURS
        )

    data.update({"exp": expire})

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )