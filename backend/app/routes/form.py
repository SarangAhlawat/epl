import uuid
from typing import Any, Optional

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendee import Attendee
from app.models.event import Event
from app.models.form_question import FormQuestion
from app.models.form_response import FormResponse

router = APIRouter()


class QuestionIn(BaseModel):

    id: Optional[str] = None

    question_text: str

    field_type: str

    is_required: bool = True

    options: Optional[list[Any]] = None

    order_index: int = 0


class SaveFormBody(BaseModel):

    questions: list[QuestionIn]


class SubmitFormJson(BaseModel):

    event_id: str

    name: str

    email: str

    roll_number: str = ""

    responses: dict[str, str] = Field(default_factory=dict)


def _question_to_dict(q: FormQuestion) -> dict:

    return {

        "id": str(q.id),

        "question_text": q.question_text,

        "field_type": q.field_type,

        "is_required": q.is_required,

        "options": q.options_json or [],

        "order_index": q.order_index,

    }


@router.post("/save-form/{event_id}")

def save_form(

    event_id: str,

    body: SaveFormBody,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(status_code=404, detail="event_not_found")

    incoming_ids = set()

    for item in body.questions:

        if item.id:

            incoming_ids.add(str(item.id))

    existing = db.query(FormQuestion).filter(

        FormQuestion.event_id == event_id

    ).all()

    for q in existing:

        if str(q.id) not in incoming_ids:

            db.query(FormResponse).filter(

                FormResponse.question_id == q.id

            ).delete()

            db.delete(q)

    order = 0

    for item in body.questions:

        order += 1

        opts = item.options if item.options is not None else []

        if item.id:

            row = db.query(FormQuestion).filter(

                FormQuestion.id == item.id,

                FormQuestion.event_id == event_id

            ).first()

            if row:

                row.question_text = item.question_text

                row.field_type = item.field_type

                row.is_required = item.is_required

                row.options_json = opts

                row.order_index = item.order_index or order

                continue

        row = FormQuestion(

            id=uuid.uuid4(),

            event_id=event_id,

            question_text=item.question_text,

            field_type=item.field_type,

            is_required=item.is_required,

            options_json=opts,

            order_index=item.order_index or order

        )

        db.add(row)

    db.commit()

    return {"status": "saved"}


@router.post("/publish/{event_id}")

def publish_form(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(status_code=404, detail="event_not_found")

    count = db.query(FormQuestion).filter(

        FormQuestion.event_id == event_id

    ).count()

    if count == 0:

        raise HTTPException(

            status_code=400,

            detail="no_questions_save_first"

        )

    ev.form_published = True

    db.commit()

    return {"status": "published", "form_published": True}


@router.post("/unpublish/{event_id}")

def unpublish_form(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(status_code=404, detail="event_not_found")

    ev.form_published = False

    db.commit()

    return {"status": "unpublished", "form_published": False}


@router.get("/get-form/{event_id}")

def get_form(

    event_id: str,

    db: Session = Depends(get_db)

):

    questions = db.query(

        FormQuestion

    ).filter(

        FormQuestion.event_id == event_id

    ).order_by(

        FormQuestion.order_index

    ).all()

    return [_question_to_dict(q) for q in questions]


@router.get("/public-context/{event_id}")

def public_context(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        return {"status": "event_not_found"}

    questions = db.query(

        FormQuestion

    ).filter(

        FormQuestion.event_id == event_id

    ).order_by(

        FormQuestion.order_index

    ).all()

    return {

        "event": {

            "id": str(ev.id),

            "title": ev.title,

            "description": ev.description,

            "venue": ev.venue,

            "date": ev.date.isoformat() if ev.date else None,

            "theme_color": ev.theme_color,

            "logo_url": ev.logo_url,

        },

        "form_published": bool(ev.form_published),

        "registration_open": bool(ev.registration_open),

        "questions": [_question_to_dict(q) for q in questions],

    }


@router.post("/submit")

def submit_form_json(

    body: SubmitFormJson,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == body.event_id).first()

    if not ev:

        raise HTTPException(status_code=404, detail="event_not_found")

    if not ev.registration_open:

        raise HTTPException(status_code=400, detail="registration_closed")

    if not ev.form_published:

        raise HTTPException(status_code=400, detail="form_not_published")

    questions = db.query(FormQuestion).filter(

        FormQuestion.event_id == body.event_id

    ).order_by(FormQuestion.order_index).all()

    if len(questions) == 0:

        raise HTTPException(status_code=400, detail="no_form_defined")

    for q in questions:

        if q.is_required:

            key = str(q.id)

            val = (body.responses or {}).get(key, "").strip()

            if not val:

                raise HTTPException(

                    status_code=400,

                    detail=f"missing_required:{key}"

                )

    uid = uuid.uuid4().hex[:16]

    attendee = Attendee(

        event_id=body.event_id,

        name=body.name,

        email=body.email,

        roll_number=body.roll_number or None,

        unique_id=uid,

        source="form",

    )

    db.add(attendee)

    db.flush()

    for q in questions:

        key = str(q.id)

        val = (body.responses or {}).get(key, "")

        if val is None:

            val = ""

        db.add(

            FormResponse(

                id=uuid.uuid4(),

                attendee_id=attendee.id,

                question_id=q.id,

                response_value=str(val),

            )

        )

    db.commit()

    db.refresh(attendee)

    return {

        "status": "form_submitted",

        "attendee_id": str(attendee.id),

        "unique_id": attendee.unique_id,

    }


@router.post("/submit-form")

def submit_form_legacy(

    event_id: str = Query(...),

    name: str = Query(...),

    email: str = Query(...),

    roll_number: str = Query(...),

    db: Session = Depends(get_db)

):

    """Legacy query-param registration (no custom fields)."""

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        return {"status": "event_not_found"}

    if not ev.registration_open:

        return {"status": "registration_closed"}

    uid = uuid.uuid4().hex[:16]

    attendee = Attendee(

        event_id=event_id,

        name=name,

        email=email,

        roll_number=roll_number,

        unique_id=uid,

        source="form",

    )

    db.add(attendee)

    db.commit()

    db.refresh(attendee)

    return {

        "status": "form_submitted",

        "attendee_id": str(attendee.id),

    }


@router.post("/add-question")

def add_question(

    event_id: str,

    question_text: str,

    field_type: str,

    is_required: bool,

    options_json: str = None,

    order_index: int = 1,

    db: Session = Depends(get_db)

):

    opts = None

    if options_json:

        import json

        try:

            opts = json.loads(options_json)

        except Exception:

            opts = []

    question = FormQuestion(

        id=uuid.uuid4(),

        event_id=event_id,

        question_text=question_text,

        field_type=field_type,

        is_required=is_required,

        options_json=opts,

        order_index=order_index,

    )

    db.add(question)

    db.commit()

    return {"status": "question_added"}
