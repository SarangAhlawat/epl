from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends
from fastapi import HTTPException

from app.database import get_db

from app.models.organization import Organization
from app.models.user import User

from app.utils.auth.password import hash_password

import uuid


router = APIRouter()



@router.post("/add-user")
def add_user(

    name: str,
    email: str,
    password: str,
    role: str,
    organization_id: str,

    db: Session = Depends(get_db)

):

    user = User(

        name=name,

        email=email,

        password_hash=
            hash_password(password),

        role=role,

        organization_id=
            organization_id

    )

    db.add(user)

    db.commit()

    return {

        "status": "user_added"

    }


@router.get("/{user_id}")
def get_user(

    user_id: str,

    db: Session = Depends(get_db)

):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.get("/organization/{organization_id}")
def get_organization(

    organization_id: str,

    db: Session = Depends(get_db)

):

    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    return organization