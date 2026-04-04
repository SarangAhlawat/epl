import uuid
import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import Boolean
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import relationship

from app.database import Base


class Event(Base):

    __tablename__ = "events"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id")
    )

    title = Column(String)

    description = Column(String)

    venue = Column(String)

    date = Column(DateTime)

    is_public = Column(
        Boolean,
        default=True
    )

    registration_open = Column(
        Boolean,
        default=True
    )

    logo_url = Column(String)

    theme_color = Column(String)

    certificate_template_url = Column(
        String
    )

    pass_template_url = Column(
        String
    )

    created_by = Column(
        UUID(as_uuid=True)
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    organization = relationship(
        "Organization",
        back_populates="events"
    )

    attendees = relationship(
        "Attendee",
        back_populates="event"
    )