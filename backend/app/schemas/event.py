from pydantic import BaseModel
from datetime import datetime


class EventCreate(BaseModel):

    title: str
    description: str
    venue: str
    date: datetime
    is_public: bool
    theme_color: str



