import uuid
import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Boolean
from sqlalchemy import Integer
from sqlalchemy import ForeignKey
from sqlalchemy import JSON
from sqlalchemy import DateTime

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import relationship

from app.database import Base


class FormQuestion(Base):

    __tablename__ = "form_questions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id")
    )

    question_text = Column(
        String,
        nullable=False
    )

    field_type = Column(
        String,
        nullable=False
    )

    is_required = Column(
        Boolean,
        default=True
    )

    options_json = Column(
        JSON,
        nullable=True
    )

    order_index = Column(
        Integer
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )