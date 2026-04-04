import uuid
import datetime

from sqlalchemy import Column
from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import String
from sqlalchemy import ForeignKey

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import relationship

from app.database import Base


class Checkin(Base):

    __tablename__ = "checkins"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    attendee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("attendees.id")
    )

    checked_in = Column(
        Boolean,
        default=False
    )

    checkin_time = Column(
        DateTime
    )

    method = Column(
        String
    )

    checked_by = Column(
        UUID(as_uuid=True)
    )

    attendee = relationship(
        "Attendee",
        back_populates="checkins"
    )