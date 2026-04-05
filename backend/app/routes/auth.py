from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends
from fastapi import HTTPException

from app.database import get_db

from app.models.user import User
from app.schemas.auth import LoginRequest
from app.utils.auth.password import (
    verify_password
)

from app.utils.auth.jwt_handler import (
    create_access_token
)

from app.models.email_verification import EmailVerification

from app.utils.auth.otp import generate_otp
from app.utils.auth.email_sender import send_verification_email

import datetime


from app.utils.auth.jwt_handler import create_access_token


router = APIRouter()


@router.post("/login-password")
def login_password(

    data: LoginRequest,

    db: Session = Depends(get_db)

):

    # Find user

    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found"

        )

    # Verify password

    if not verify_password(

        data.password,
        user.password_hash

    ):

        raise HTTPException(

            status_code=401,

            detail="Wrong password"

        )

    # Create JWT token

    token = create_access_token({

        "user_id": str(user.id),

        "organization_id": str(user.organization_id),

        "role": user.role

    })

    return {

        "access_token": token,

        "token_type": "bearer"

    }







@router.post("/send-otp")
def send_otp(

    email: str,

    db: Session = Depends(get_db)

):

    otp = generate_otp()

    expiry = datetime.datetime.utcnow() + \
        datetime.timedelta(minutes=10)

    verification = EmailVerification(

        email=email,

        otp_code=otp,

        expires_at=expiry

    )

    db.add(verification)

    db.commit()

    send_verification_email(
        email,
        otp
    )

    return {

        "status":
        "otp_sent"

    }





@router.post("/verify-otp")

def verify_otp(

    email: str,
    otp: str,

    db: Session = Depends(get_db)

):

    record = db.query(
        EmailVerification
    ).filter(

        EmailVerification.email == email,
        EmailVerification.otp_code == otp

    ).first()

    if not record:

        return {
            "status":
            "invalid_otp"
        }

    if record.expires_at < datetime.datetime.utcnow():

        return {
            "status":
            "otp_expired"
        }

    record.is_verified = True

    db.commit()

    return {

        "status":
        "verified"

    }





@router.post("/login-otp")

def login_with_otp(

    email: str,
    otp: str,

    db: Session = Depends(get_db)

):

    record = db.query(
        EmailVerification
    ).filter(

        EmailVerification.email == email,
        EmailVerification.otp_code == otp,
        EmailVerification.is_verified == True

    ).first()

    if not record:

        return {
            "status":
            "otp_not_verified"
        }

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:

        return {
            "status":
            "user_not_found"
        }

    token = create_access_token({

        "user_id": str(user.id),

        "organization_id": str(user.organization_id),

        "role": user.role

    })

    return {

        "access_token": token

    }