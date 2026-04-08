from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Form
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from pydantic import BaseModel
from pydantic import Field
from fastapi.responses import StreamingResponse

from sqlalchemy import or_
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.database import get_db

from app.models.event import Event

from app.utils.s3 import upload_file_to_s3

import uuid
import datetime
import io
import csv


from app.models.attendee import Attendee
from app.models.checkin import Checkin
from app.models.form_question import FormQuestion


router = APIRouter()
EXCEL_UPLOAD_CACHE: dict[str, dict] = {}

try:
    import resend
except Exception:
    resend = None


def _normalize_col(name: str) -> str:

    return "_".join((name or "").strip().lower().split())


def _extract_rows_from_upload(file: UploadFile) -> tuple[list[str], list[dict[str, str]]]:

    filename = (file.filename or "").lower()
    data = file.file.read()

    if filename.endswith(".csv"):

        text_data = data.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(text_data))
        columns = list(reader.fieldnames or [])
        rows = []
        for row in reader:
            rows.append({k: ("" if v is None else str(v).strip()) for k, v in row.items()})
        return columns, rows

    try:
        openpyxl_mod = __import__("openpyxl")
        load_workbook = openpyxl_mod.load_workbook
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="openpyxl_not_installed_on_backend",
        )

    book = load_workbook(io.BytesIO(data), data_only=True)
    sheet = book.active
    if sheet is None:
        return [], []

    rows_iter = sheet.iter_rows(values_only=True)
    header = next(rows_iter, None)
    if not header:
        return [], []

    columns = [str(x).strip() if x is not None else "" for x in header]
    rows = []
    for raw in rows_iter:
        values = list(raw or [])
        # Skip entirely empty rows
        if all(v is None or str(v).strip() == "" for v in values):
            continue
        row = {}
        for i, col in enumerate(columns):
            if not col:
                continue
            val = values[i] if i < len(values) else ""
            row[col] = "" if val is None else str(val).strip()
        rows.append(row)
    return columns, rows


def _auto_map(columns: list[str]) -> dict[str, str]:

    result = {}
    for col in columns:
        n = _normalize_col(col)
        if n in ("name", "full_name", "attendee_name"):
            result[col] = "name"
        elif n in ("email", "email_address", "mail"):
            result[col] = "email"
        elif n in ("roll", "roll_no", "roll_number", "id", "student_id", "registration_id"):
            result[col] = "roll_number"
        else:
            result[col] = ""
    return result


class ImportExcelBody(BaseModel):

    upload_token: str

    mapping: dict[str, str] = {}


def _build_checked_map(db: Session, event_id: str) -> dict[str, Checkin]:

    checkins = db.query(Checkin).join(
        Attendee,
        Checkin.attendee_id == Attendee.id
    ).filter(
        Attendee.event_id == event_id
    ).order_by(
        Checkin.checkin_time.desc()
    ).all()
    out = {}
    for c in checkins:
        k = str(c.attendee_id)
        if k not in out:
            out[k] = c
    return out


def _normalize_search_text(v: str) -> str:
    return (v or "").strip().lower()


@router.post("/create")

def create_event(

    title: str = Form(...),

    description: str = Form(...),

    venue: str = Form(...),

    date: datetime.datetime = Form(...),

    is_public: bool = Form(...),

    theme_color: str = Form(...),

    logo: UploadFile = File(...),

    # pass_template: UploadFile = File(...),

    # certificate_template:
    #     UploadFile = File(...),

    organization_id: str = Form(...),

    created_by: str = Form(...),

    db: Session = Depends(get_db)

):

    # Upload files

    logo_url = upload_file_to_s3(
        logo,
        "events/logos"
    )

    # pass_url = upload_file_to_s3(
    #     pass_template,
    #     "events/passes"
    # )

    # certificate_url = upload_file_to_s3(
    #     certificate_template,
    #     "events/certificates"
    # )

    event = Event(

        id=uuid.uuid4(),

        organization_id=organization_id,

        title=title,

        description=description,

        venue=venue,

        date=date,

        is_public=is_public,

        theme_color=theme_color,

        logo_url=logo_url,

        # pass_template_url=pass_url,

        # certificate_template_url=
        #     certificate_url,

        created_by=created_by,

        created_at=datetime.datetime.utcnow()

    )

    db.add(event)

    db.commit()

    db.refresh(event)

    return {

        "status":
        "event_created",

        "event_id":
        str(event.id)

    }



@router.get("/list")

def list_events(

    organization_id: str | None = None,

    db: Session = Depends(get_db)

):

    query = db.query(Event)

    if organization_id:
        query = query.filter(
            Event.organization_id == organization_id
        )

    events = query.order_by(
        Event.created_at.desc()
    ).all()

    return events


# GET SINGLE EVENT

@router.get("/{event_id}")

def get_event(

    event_id: str,

    db: Session = Depends(get_db)

):

    event = db.query(
        Event
    ).filter(
        Event.id == event_id
    ).first()

    if not event:

        return {
            "status": "event_not_found"
        }

    return event




@router.get("/{event_id}/stats")

def event_stats(

    event_id: str,
    db: Session = Depends(get_db)

):

    total = db.query(
        Attendee
    ).filter(
        Attendee.event_id == event_id
    ).count()

    checked = db.query(

        func.count(func.distinct(Checkin.attendee_id))

    ).join(

        Attendee,

        Checkin.attendee_id == Attendee.id

    ).filter(

        Attendee.event_id == event_id,

        Checkin.checked_in == True

    ).scalar() or 0

    return {

        "total_registered": total,

        "checked_in": checked,

        "pending":
            total - checked

    }


@router.get("/{event_id}/attendees")
def event_attendees(

    event_id: str,
    db: Session = Depends(get_db)

):

    attendees = db.query(
        Attendee
    ).filter(
        Attendee.event_id == event_id
    ).order_by(
        Attendee.created_at.desc()
    ).all()

    return attendees


@router.post("/{event_id}/upload-excel")
def upload_excel_preview(

    event_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(404, "event_not_found")

    columns, rows = _extract_rows_from_upload(file)
    if len(columns) == 0:
        raise HTTPException(400, "no_columns_found")

    token = uuid.uuid4().hex
    EXCEL_UPLOAD_CACHE[token] = {
        "event_id": event_id,
        "columns": columns,
        "rows": rows,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }

    return {
        "upload_token": token,
        "columns": columns,
        "preview_rows": rows[:5],
        "suggested_mapping": _auto_map(columns),
        "row_count": len(rows),
    }


@router.post("/{event_id}/import-excel")
def import_excel_rows(

    event_id: str,
    body: ImportExcelBody,
    db: Session = Depends(get_db)

):

    cached = EXCEL_UPLOAD_CACHE.get(body.upload_token)
    if not cached:
        raise HTTPException(400, "upload_token_invalid_or_expired")
    if cached.get("event_id") != event_id:
        raise HTTPException(400, "upload_token_event_mismatch")

    rows = cached.get("rows", [])
    mapping = body.mapping or {}
    imported = 0

    for row in rows:
        name = ""
        email = ""
        roll_number = ""
        extra = {}

        for col, raw_value in row.items():
            mapped = (mapping.get(col) or "").strip()
            value = "" if raw_value is None else str(raw_value).strip()

            if mapped == "__drop__":
                continue

            if mapped == "name":
                name = value
            elif mapped == "email":
                email = value
            elif mapped == "roll_number":
                roll_number = value
            else:
                # Keep all unmapped/other columns as dynamic attendee attributes
                extra[col] = value

        if not name and ("name" in row):
            name = str(row.get("name") or "").strip()
        if not email and ("email" in row):
            email = str(row.get("email") or "").strip()
        if not roll_number:
            for key in ("roll_number", "roll no", "roll_no", "id"):
                if key in row and str(row.get(key) or "").strip():
                    roll_number = str(row.get(key) or "").strip()
                    break

        if not name and not email and not roll_number and len(extra) == 0:
            continue

        attendee = Attendee(
            event_id=event_id,
            name=name or None,
            email=email or None,
            roll_number=roll_number or None,
            unique_id=uuid.uuid4().hex[:16],
            source="excel",
            extra_data=extra or None,
        )
        db.add(attendee)
        imported += 1

    db.commit()
    EXCEL_UPLOAD_CACHE.pop(body.upload_token, None)

    return {"status": "ok", "imported": imported}


@router.get("/{event_id}/attendees/download")
def download_attendee_excel(

    event_id: str,
    include_columns: str | None = Query(None),
    checked_first: bool = Query(True),
    db: Session = Depends(get_db)

):

    try:
        openpyxl_mod = __import__("openpyxl")
        Workbook = openpyxl_mod.Workbook
    except Exception:
        raise HTTPException(status_code=500, detail="openpyxl_not_installed_on_backend")

    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(404, "event_not_found")

    attendees = db.query(Attendee).options(
        selectinload(Attendee.form_responses)
    ).filter(
        Attendee.event_id == event_id
    ).all()

    questions = db.query(FormQuestion).filter(
        FormQuestion.event_id == event_id
    ).order_by(FormQuestion.order_index).all()

    q_labels = [q.question_text for q in questions]
    q_ids = [str(q.id) for q in questions]

    excel_cols = []
    seen_excel = set()
    for a in attendees:
        for k in ((a.extra_data or {}).keys()):
            if k not in seen_excel:
                seen_excel.add(k)
                excel_cols.append(k)

    checked_map = _build_checked_map(db, event_id)

    if checked_first:
        attendees = sorted(
            attendees,
            key=lambda a: (0 if (checked_map.get(str(a.id)) and checked_map[str(a.id)].checked_in) else 1, -(a.created_at.timestamp() if a.created_at else 0))
        )
    else:
        attendees = sorted(
            attendees,
            key=lambda a: (-(a.created_at.timestamp() if a.created_at else 0))
        )

    include_set = None
    if include_columns:
        include_set = {x.strip() for x in include_columns.split(",") if x.strip()}

    wb = Workbook()
    ws = wb.active
    ws.title = "Attendees"

    all_header = [
        "name", "email", "roll_number", "source", "unique_id",
        *excel_cols,
        *q_labels,
        "pass_url", "qr_url", "pass_mail_status", "other_mail_status", "checked_in",
    ]
    if include_set is None:
        header = all_header
    else:
        header = [h for h in all_header if h in include_set]
        if len(header) == 0:
            header = all_header
    ws.append(header)

    q_id_to_label_index = {qid: idx for idx, qid in enumerate(q_ids)}
    for a in attendees:
        c_row = checked_map.get(str(a.id))
        checked_in_val = "Yes" if (c_row and c_row.checked_in) else "No"

        all_row_values = {
            "name": a.name or "",
            "email": a.email or "",
            "roll_number": a.roll_number or "",
            "source": a.source or "",
            "unique_id": a.unique_id or "",
            "pass_url": a.pass_url or "",
            "qr_url": a.qr_url or "",
            "pass_mail_status": a.pass_mail_status or "",
            "other_mail_status": a.other_mail_status or "",
            "checked_in": checked_in_val,
        }

        row = [
            a.name or "",
            a.email or "",
            a.roll_number or "",
            a.source or "",
            a.unique_id or "",
        ]

        extra_data = a.extra_data or {}
        row.extend([(extra_data.get(c) or "") for c in excel_cols])

        resp_vals = [""] * len(q_labels)
        for fr in (a.form_responses or []):
            idx = q_id_to_label_index.get(str(fr.question_id))
            if idx is not None:
                resp_vals[idx] = fr.response_value or ""
        row.extend(resp_vals)

        row.extend([
            a.pass_url or "",
            a.qr_url or "",
            a.pass_mail_status or "",
            a.other_mail_status or "",
            checked_in_val,
        ])

        # Merge dynamic fields into dictionary for column filtering.
        cursor = 0
        for k in ["name", "email", "roll_number", "source", "unique_id"]:
            all_row_values[k] = row[cursor]
            cursor += 1
        for k in excel_cols:
            all_row_values[k] = row[cursor]
            cursor += 1
        for k in q_labels:
            all_row_values[k] = row[cursor]
            cursor += 1
        for k in ["pass_url", "qr_url", "pass_mail_status", "other_mail_status", "checked_in"]:
            all_row_values[k] = row[cursor]
            cursor += 1

        ws.append([all_row_values.get(h, "") for h in header])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"event-{event_id}-attendees.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


class CheckInBody(BaseModel):

    attendee_id: str | None = None

    unique_id: str | None = None
    send_checkin_mail: bool = True
    selected_mail_fields: list[str] | None = None


def _send_checkin_confirmation_mail(
    db: Session,
    event_id: str,
    attendee: Attendee,
    selected_fields: list[str] | None,
) -> str:
    if not attendee.email:
        return "skipped_no_email"

    if resend is None:
        return "skipped_no_resend"

    from app.config import settings
    if not settings.RESEND_API_KEY:
        return "skipped_no_resend_api_key"

    resend.api_key = settings.RESEND_API_KEY

    field_keys = selected_fields or ["name", "email", "roll_number", "unique_id"]
    base_values = {
        "name": attendee.name or "",
        "email": attendee.email or "",
        "roll_number": attendee.roll_number or "",
        "unique_id": attendee.unique_id or "",
    }
    extra_values = attendee.extra_data or {}

    # Build question-id and question-label maps for selectable form fields.
    question_map = {
        str(q.id): q.question_text
        for q in db.query(FormQuestion).filter(FormQuestion.event_id == event_id).all()
    }
    responses_by_qid = {
        str(fr.question_id): (fr.response_value or "")
        for fr in (attendee.form_responses or [])
    }

    lines: list[str] = []
    for key in field_keys:
        if key in base_values:
            lines.append(f"<li><strong>{key}:</strong> {base_values[key]}</li>")
            continue

        if key.startswith("extra:"):
            col = key.split(":", 1)[1]
            lines.append(f"<li><strong>{col}:</strong> {extra_values.get(col, '')}</li>")
            continue

        if key.startswith("form:"):
            qid = key.split(":", 1)[1]
            label = question_map.get(qid, qid)
            lines.append(f"<li><strong>{label}:</strong> {responses_by_qid.get(qid, '')}</li>")
            continue

    html = (
        "<div style='font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5;'>"
        f"<p>Hi {attendee.name or 'Attendee'},</p>"
        "<p>Your check-in is confirmed.</p>"
        "<p><strong>Details:</strong></p>"
        f"<ul>{''.join(lines) or '<li>No details selected.</li>'}</ul>"
        "</div>"
    )

    try:
        resend.Emails.send(
            {
                "from": "noreply@ecellcgc.in",
                "to": attendee.email,
                "subject": "Check-in confirmed",
                "html": html,
            }
        )
        return "sent"
    except Exception:
        return "failed"


@router.get("/{event_id}/attendees/sheet")

def attendee_sheet(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    questions = db.query(FormQuestion).filter(

        FormQuestion.event_id == event_id

    ).order_by(FormQuestion.order_index).all()

    question_columns = [

        {

            "id": str(q.id),

            "label": q.question_text,

            "field_type": q.field_type,

        }

        for q in questions

    ]

    attendees = db.query(Attendee).options(

        selectinload(Attendee.form_responses)

    ).filter(

        Attendee.event_id == event_id

    ).order_by(

        Attendee.created_at.desc()

    ).all()

    checkin_by_attendee = _build_checked_map(db, event_id)
    excel_columns = []
    seen_excel_columns = set()

    rows = []

    for a in attendees:

        responses_map = {

            str(fr.question_id): fr.response_value

            for fr in (a.form_responses or [])

        }

        c = checkin_by_attendee.get(str(a.id))
        extra_data = a.extra_data or {}
        for key in extra_data.keys():
            if key not in seen_excel_columns:
                seen_excel_columns.add(key)
                excel_columns.append(key)

        rows.append(

            {

                "id": str(a.id),

                "name": a.name,

                "email": a.email,

                "roll_number": a.roll_number,

                "source": a.source,

                "unique_id": a.unique_id,

                "qr_url": a.qr_url,

                "pass_url": a.pass_url,

                "pass_mail_status": a.pass_mail_status,

                "other_mail_status": a.other_mail_status,

                "checked_in": bool(c and c.checked_in),

                "checkin_time": (

                    c.checkin_time.isoformat()

                    if c and c.checkin_time

                    else None

                ),

                "responses": responses_map,
                "extra_data": extra_data,

            }

        )

    return {

        "event": {

            "id": str(ev.id),

            "title": ev.title,

            "form_published": bool(ev.form_published),

        },

        "question_columns": question_columns,
        "excel_columns": excel_columns,
        "custom_columns": excel_columns,

        "rows": rows,

    }


@router.get("/{event_id}/attendees/search")

def search_attendees(

    event_id: str,

    q: str = Query("", alias="q"),

    db: Session = Depends(get_db)

):

    q = (q or "").strip()

    if len(q) < 1:

        return []

    qn = _normalize_search_text(q)

    attendees = db.query(Attendee).options(
        selectinload(Attendee.form_responses)
    ).filter(
        Attendee.event_id == event_id,
    ).all()

    questions = db.query(FormQuestion).filter(FormQuestion.event_id == event_id).all()
    question_by_id = {str(item.id): item for item in questions}

    filtered = []
    for a in attendees:
        matched = False
        primary_hits = 0
        match_fields: list[str] = []

        for label, value in (
            ("name", a.name or ""),
            ("email", a.email or ""),
            ("roll_number", a.roll_number or ""),
            ("unique_id", a.unique_id or ""),
        ):
            if qn in _normalize_search_text(str(value)):
                matched = True
                primary_hits += 1
                match_fields.append(label)

        for key, value in (a.extra_data or {}).items():
            vv = str(value or "")
            if qn in _normalize_search_text(vv) or qn in _normalize_search_text(str(key)):
                matched = True
                match_fields.append(f"extra:{key}")

        for fr in (a.form_responses or []):
            q_obj = question_by_id.get(str(fr.question_id))
            q_label = q_obj.question_text if q_obj else str(fr.question_id)
            vv = str(fr.response_value or "")
            if qn in _normalize_search_text(vv) or qn in _normalize_search_text(q_label):
                matched = True
                match_fields.append(f"form:{q_label}")

        if matched:
            filtered.append((a, primary_hits, len(match_fields), match_fields[:4]))

    filtered.sort(key=lambda x: (x[1], x[2], x[0].created_at.timestamp() if x[0].created_at else 0), reverse=True)
    attendees = [x[0] for x in filtered[:30]]
    match_map = {str(x[0].id): x[3] for x in filtered[:30]}

    checked_map = _build_checked_map(db, event_id)

    return [

        {

            "id": str(a.id),

            "name": a.name,

            "email": a.email,

            "roll_number": a.roll_number,

            "unique_id": a.unique_id,
            "primary_column": (
                [{"key": k, "value": v} for k, v in (a.extra_data or {}).items() if str(v or "").strip()][:1]
                or []
            )[0] if (a.extra_data or {}) else None,
            "matched_fields": match_map.get(str(a.id), []),
            "checked_in": bool(
                checked_map.get(str(a.id))
                and checked_map[str(a.id)].checked_in
            ),

        }

        for a in attendees

    ]


@router.post("/{event_id}/check-in")

def check_in_attendee(

    event_id: str,

    body: CheckInBody,

    db: Session = Depends(get_db)

):

    if not body.attendee_id and not body.unique_id:

        raise HTTPException(400, "attendee_id_or_unique_id_required")

    q = db.query(Attendee).options(
        selectinload(Attendee.form_responses)
    ).filter(Attendee.event_id == event_id)

    if body.unique_id:

        a = q.filter(Attendee.unique_id == body.unique_id.strip()).first()

    else:

        a = q.filter(Attendee.id == body.attendee_id).first()

    if not a:

        raise HTTPException(404, "attendee_not_found")

    existing = db.query(Checkin).filter(

        Checkin.attendee_id == a.id

    ).first()

    now = datetime.datetime.utcnow()

    if existing:

        existing.checked_in = True

        existing.checkin_time = now

        existing.method = "dashboard"

    else:

        db.add(

            Checkin(

                id=uuid.uuid4(),

                attendee_id=a.id,

                checked_in=True,

                checkin_time=now,

                method="dashboard",

                checked_by=None,

            )

        )

    db.commit()
    mail_status = "disabled"
    if body.send_checkin_mail:
        mail_status = _send_checkin_confirmation_mail(
            db=db,
            event_id=event_id,
            attendee=a,
            selected_fields=body.selected_mail_fields,
        )

    return {

        "status": "checked_in",

        "attendee_id": str(a.id),

        "name": a.name,
        "mail_status": mail_status,

    }


@router.post("/{event_id}/uncheck-in")
def uncheck_in_attendee(

    event_id: str,

    body: CheckInBody,

    db: Session = Depends(get_db)

):

    if not body.attendee_id and not body.unique_id:
        raise HTTPException(400, "attendee_id_or_unique_id_required")

    q = db.query(Attendee).filter(Attendee.event_id == event_id)
    if body.unique_id:
        a = q.filter(Attendee.unique_id == body.unique_id.strip()).first()
    else:
        a = q.filter(Attendee.id == body.attendee_id).first()

    if not a:
        raise HTTPException(404, "attendee_not_found")

    existing = db.query(Checkin).filter(Checkin.attendee_id == a.id).first()
    now = datetime.datetime.utcnow()

    if existing:
        existing.checked_in = False
        existing.checkin_time = now
        existing.method = "dashboard_uncheck"
    else:
        db.add(
            Checkin(
                id=uuid.uuid4(),
                attendee_id=a.id,
                checked_in=False,
                checkin_time=now,
                method="dashboard_uncheck",
                checked_by=None,
            )
        )

    db.commit()
    return {
        "status": "unchecked",
        "attendee_id": str(a.id),
        "name": a.name,
    }


@router.get("/{event_id}/checkin-logs")
def checkin_logs(
    event_id: str,
    limit: int = 5,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Checkin, Attendee)
        .join(Attendee, Checkin.attendee_id == Attendee.id)
        .filter(Attendee.event_id == event_id)
        .order_by(Checkin.checkin_time.desc())
        .limit(limit)
        .all()
    )

    out = []
    for ci, a in rows:
        out.append(
            {
                "attendee_id": str(ci.attendee_id),
                "name": a.name,
                "checked_in": ci.checked_in,
                "checkin_time": ci.checkin_time.isoformat() if ci.checkin_time else None,
                "method": ci.method,
            }
        )

    return out


class ResetAttendeeBody(BaseModel):
    pass_url: bool = Field(default=False)
    qr_url: bool = Field(default=False)
    pass_mail_status: bool = Field(default=False)
    other_mail_status: bool = Field(default=False)


@router.post("/{event_id}/attendees/{attendee_id}/reset")
def reset_attendee_fields(
    event_id: str,
    attendee_id: str,
    body: ResetAttendeeBody,
    db: Session = Depends(get_db),
):
    a = (
        db.query(Attendee)
        .filter(Attendee.event_id == event_id)
        .filter(Attendee.id == attendee_id)
        .first()
    )
    if not a:
        raise HTTPException(404, "attendee_not_found")

    changed = []
    if body.pass_url:
        a.pass_url = None
        changed.append("pass_url")
    if body.qr_url:
        a.qr_url = None
        changed.append("qr_url")
    if body.pass_mail_status:
        a.pass_mail_status = None
        changed.append("pass_mail_status")
    if body.other_mail_status:
        a.other_mail_status = None
        changed.append("other_mail_status")

    db.commit()

    return {"status": "ok", "attendee_id": str(a.id), "changed": changed}