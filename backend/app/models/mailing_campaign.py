import uuid
import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Text
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class MailingCampaign(Base):

    __tablename__ = "mailing_campaigns"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        nullable=False
    )

    campaign_type = Column(
        String,
        nullable=False
    )

    subject = Column(String, nullable=True)

    html_body = Column(Text, nullable=True)

    attachment_urls = Column(JSON, nullable=True)

    log_lines = Column(JSON, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    event = relationship(
        "Event",
        back_populates="mailing_campaigns"
    )
