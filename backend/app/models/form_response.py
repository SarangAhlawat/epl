import uuid

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class FormResponse(Base):

    __tablename__ = "form_responses"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    attendee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("attendees.id")
    )

    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("form_questions.id")
    )

    response_value = Column(
        String
    )

    attendee = relationship(
        "Attendee",
        back_populates="form_responses"
    )

    question = relationship(
        "FormQuestion",
        back_populates="form_responses"
    )