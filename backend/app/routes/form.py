from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.form_question import FormQuestion

import uuid

router = APIRouter()


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

    question = FormQuestion(

        id=uuid.uuid4(),

        event_id=event_id,

        question_text=question_text,

        field_type=field_type,

        is_required=is_required,

        options_json=options_json,

        order_index=order_index

    )

    db.add(question)

    db.commit()

    return {

        "status":
        "question_added"

    }




@router.get("/get-form/{event_id}")

def get_form(

    event_id: str,

    db: Session = Depends(get_db)

):

    questions = db.query(
        FormQuestion
    ).filter(

        FormQuestion.event_id
        == event_id

    ).order_by(
        FormQuestion.order_index
    ).all()

    return questions




from fastapi import UploadFile
from fastapi import File
from app.models.attendee import Attendee
from app.models.form_response import FormResponse
from app.utils.s3 import upload_file_to_s3


@router.post("/submit-form")

def submit_form(

    event_id: str,

    name: str,

    email: str,

    roll_number: str,

    db: Session = Depends(get_db)

):

    attendee = Attendee(

        event_id=event_id,

        name=name,

        email=email,

        roll_number=roll_number,

        source="form"

    )

    db.add(attendee)

    db.commit()

    db.refresh(attendee)

    return {

        "status":
        "form_submitted",

        "attendee_id":
        str(attendee.id)

    }