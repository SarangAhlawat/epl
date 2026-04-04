from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base

from app.models import organization
from app.models import user
from app.models import event
from app.models import attendee
from app.models import checkin

from app.routes import admin
from app.routes import user as user_routes
from app.routes import auth

from app.routes import event
from app.routes import form


app = FastAPI(
    title="Event Platform API",
    version="1.0.0"
)


# CORS

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)


# Create tables

Base.metadata.create_all(
    bind=engine
)


# Routers

app.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)

app.include_router(
    user_routes.router,
    prefix="/users",
    tags=["Users"]
)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)



app.include_router(
    event.router,
    prefix="/events",
    tags=["Events"]
)

app.include_router(
    form.router,
    prefix="/form",
    tags=["Form Builder"]
)


@app.get("/")
def home():

    return {

        "message":
        "Event Platform Backend Running 🚀"

    }