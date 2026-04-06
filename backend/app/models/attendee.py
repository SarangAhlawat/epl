import uuid
import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import relationship

from app.database import Base


class Attendee(Base):

    __tablename__ = "attendees"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id")
    )

    name = Column(String)

    email = Column(String)

    roll_number = Column(String)

    unique_id = Column(
        String,
        unique=True
    )

    qr_url = Column(String)

    pass_url = Column(String)

    certificate_url = Column(
        String
    )

    source = Column(String)

    pass_mail_status = Column(
        String,
        nullable=True
    )

    other_mail_status = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    event = relationship(
        "Event",
        back_populates="attendees"
    )

    checkins = relationship(
        "Checkin",
        back_populates="attendee"
    )

    form_responses = relationship(
        "FormResponse",
        back_populates="attendee",
        cascade="all, delete-orphan"
    )