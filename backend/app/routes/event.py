from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Form
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.event import Event

from app.utils.s3 import upload_file_to_s3

import uuid
import datetime


router = APIRouter()


@router.post("/create")

def create_event(

    title: str = Form(...),

    description: str = Form(...),

    venue: str = Form(...),

    date: datetime.datetime = Form(...),

    is_public: bool = Form(...),

    theme_color: str = Form(...),

    logo: UploadFile = File(...),

    pass_template: UploadFile = File(...),

    certificate_template:
        UploadFile = File(...),

    organization_id: str = Form(...),

    created_by: str = Form(...),

    db: Session = Depends(get_db)

):

    # Upload files

    logo_url = upload_file_to_s3(
        logo,
        "events/logos"
    )

    pass_url = upload_file_to_s3(
        pass_template,
        "events/passes"
    )

    certificate_url = upload_file_to_s3(
        certificate_template,
        "events/certificates"
    )

    event = Event(

        id=uuid.uuid4(),

        organization_id=organization_id,

        title=title,

        description=description,

        venue=venue,

        date=date,

        is_public=is_public,

        theme_color=theme_color,

        logo_url=logo_url,

        pass_template_url=pass_url,

        certificate_template_url=
            certificate_url,

        created_by=created_by,

        created_at=datetime.datetime.utcnow()

    )

    db.add(event)

    db.commit()

    db.refresh(event)

    return {

        "status":
        "event_created",

        "event_id":
        str(event.id)

    }



@router.get("/list")

def list_events(

    db: Session = Depends(get_db)

):

    events = db.query(
        Event
    ).all()

    return events


# GET SINGLE EVENT

@router.get("/{event_id}")

def get_event(

    event_id: str,

    db: Session = Depends(get_db)

):

    event = db.query(
        Event
    ).filter(
        Event.id == event_id
    ).first()

    if not event:

        return {
            "status": "event_not_found"
        }

    return event