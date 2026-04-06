from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Form
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from pydantic import BaseModel

from sqlalchemy import or_
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.database import get_db

from app.models.event import Event

from app.utils.s3 import upload_file_to_s3

import uuid
import datetime


from app.models.attendee import Attendee
from app.models.checkin import Checkin
from app.models.form_question import FormQuestion


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

    organization_id: str | None = None,

    db: Session = Depends(get_db)

):

    query = db.query(Event)

    if organization_id:
        query = query.filter(
            Event.organization_id == organization_id
        )

    events = query.order_by(
        Event.created_at.desc()
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




@router.get("/{event_id}/stats")

def event_stats(

    event_id: str,
    db: Session = Depends(get_db)

):

    total = db.query(
        Attendee
    ).filter(
        Attendee.event_id == event_id
    ).count()

    checked = db.query(

        func.count(func.distinct(Checkin.attendee_id))

    ).join(

        Attendee,

        Checkin.attendee_id == Attendee.id

    ).filter(

        Attendee.event_id == event_id,

        Checkin.checked_in == True

    ).scalar() or 0

    return {

        "total_registered": total,

        "checked_in": checked,

        "pending":
            total - checked

    }


@router.get("/{event_id}/attendees")
def event_attendees(

    event_id: str,
    db: Session = Depends(get_db)

):

    attendees = db.query(
        Attendee
    ).filter(
        Attendee.event_id == event_id
    ).order_by(
        Attendee.created_at.desc()
    ).all()

    return attendees


class CheckInBody(BaseModel):

    attendee_id: str | None = None

    unique_id: str | None = None


@router.get("/{event_id}/attendees/sheet")

def attendee_sheet(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    questions = db.query(FormQuestion).filter(

        FormQuestion.event_id == event_id

    ).order_by(FormQuestion.order_index).all()

    question_columns = [

        {

            "id": str(q.id),

            "label": q.question_text,

            "field_type": q.field_type,

        }

        for q in questions

    ]

    attendees = db.query(Attendee).options(

        selectinload(Attendee.form_responses)

    ).filter(

        Attendee.event_id == event_id

    ).order_by(

        Attendee.created_at.desc()

    ).all()

    checkins = db.query(Checkin).join(

        Attendee,

        Checkin.attendee_id == Attendee.id

    ).filter(

        Attendee.event_id == event_id,

        Checkin.checked_in == True

    ).all()

    checkin_by_attendee = {str(c.attendee_id): c for c in checkins}

    rows = []

    for a in attendees:

        responses_map = {

            str(fr.question_id): fr.response_value

            for fr in (a.form_responses or [])

        }

        c = checkin_by_attendee.get(str(a.id))

        rows.append(

            {

                "id": str(a.id),

                "name": a.name,

                "email": a.email,

                "roll_number": a.roll_number,

                "source": a.source,

                "unique_id": a.unique_id,

                "qr_url": a.qr_url,

                "pass_url": a.pass_url,

                "pass_mail_status": a.pass_mail_status,

                "other_mail_status": a.other_mail_status,

                "checked_in": c is not None,

                "checkin_time": (

                    c.checkin_time.isoformat()

                    if c and c.checkin_time

                    else None

                ),

                "responses": responses_map,

            }

        )

    return {

        "event": {

            "id": str(ev.id),

            "title": ev.title,

            "form_published": bool(ev.form_published),

        },

        "question_columns": question_columns,

        "rows": rows,

    }


@router.get("/{event_id}/attendees/search")

def search_attendees(

    event_id: str,

    q: str = Query("", alias="q"),

    db: Session = Depends(get_db)

):

    q = (q or "").strip()

    if len(q) < 1:

        return []

    like = f"%{q}%"

    attendees = db.query(Attendee).filter(

        Attendee.event_id == event_id,

        or_(

            Attendee.name.ilike(like),

            Attendee.email.ilike(like),

            Attendee.roll_number.ilike(like),

            Attendee.unique_id.ilike(like),

        ),

    ).limit(30).all()

    return [

        {

            "id": str(a.id),

            "name": a.name,

            "email": a.email,

            "roll_number": a.roll_number,

            "unique_id": a.unique_id,

        }

        for a in attendees

    ]


@router.post("/{event_id}/check-in")

def check_in_attendee(

    event_id: str,

    body: CheckInBody,

    db: Session = Depends(get_db)

):

    if not body.attendee_id and not body.unique_id:

        raise HTTPException(400, "attendee_id_or_unique_id_required")

    q = db.query(Attendee).filter(Attendee.event_id == event_id)

    if body.unique_id:

        a = q.filter(Attendee.unique_id == body.unique_id.strip()).first()

    else:

        a = q.filter(Attendee.id == body.attendee_id).first()

    if not a:

        raise HTTPException(404, "attendee_not_found")

    existing = db.query(Checkin).filter(

        Checkin.attendee_id == a.id

    ).first()

    now = datetime.datetime.utcnow()

    if existing:

        existing.checked_in = True

        existing.checkin_time = now

        existing.method = "dashboard"

    else:

        db.add(

            Checkin(

                id=uuid.uuid4(),

                attendee_id=a.id,

                checked_in=True,

                checkin_time=now,

                method="dashboard",

                checked_by=None,

            )

        )

    db.commit()

    return {

        "status": "checked_in",

        "attendee_id": str(a.id),

        "name": a.name,

    }