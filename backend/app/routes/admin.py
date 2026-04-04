from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db

from app.models.organization import Organization
from app.models.user import User

from app.utils.auth.password import hash_password

import uuid


router = APIRouter()


@router.post(
    "/create-organization"
)
def create_organization(

    name: str,
    email: str,
    password: str,

    db: Session = Depends(get_db)

):

    org = Organization(

        id=uuid.uuid4(),

        name=name,

        slug=name.lower().replace(" ", "-")

    )

    db.add(org)

    db.commit()

    db.refresh(org)

    admin_user = User(

        organization_id=org.id,

        name="Admin",

        email=email,

        password_hash=
            hash_password(password),

        role="admin"

    )

    db.add(admin_user)

    db.commit()

    return {

        "status":
        "organization_created"

    }