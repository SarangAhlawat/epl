import datetime
import io
import uuid
import re
import json
import smtplib
import ssl
from html import escape
from email.mime.text import MIMEText
import qrcode
from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.attendee import Attendee
from app.models.event import Event
from app.models.form_question import FormQuestion
from app.models.mailing_campaign import MailingCampaign
from app.utils.s3 import upload_bytes_to_s3
from app.utils.s3 import upload_file_to_s3

try:
    import resend
    from app.config import settings as _settings
    resend.api_key = _settings.RESEND_API_KEY
except Exception:
    resend = None

router = APIRouter()


def _normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (value or "").strip().lower()).strip("_")


def _resolve_recipient_email(
    attendee: Attendee,
    question_by_id: dict[str, FormQuestion] | None = None,
) -> str:
    if attendee.email and str(attendee.email).strip():
        return str(attendee.email).strip()

    extra = attendee.extra_data or {}
    for key, val in extra.items():
        nk = _normalize_key(str(key))
        if nk in ("email", "email_address", "mail", "e_mail"):
            v = str(val or "").strip()
            if v:
                return v

    if question_by_id:
        for fr in (attendee.form_responses or []):
            q = question_by_id.get(str(fr.question_id))
            if not q:
                continue
            qn = _normalize_key(q.question_text or "")
            if qn == "email":
                v = str(fr.response_value or "").strip()
                if v:
                    return v

    return ""


def _merge_placeholders(
    template: str,
    attendee: Attendee,
    question_by_id: dict[str, FormQuestion] | None = None,
    recipient_email: str | None = None,
) -> str:
    values: dict[str, str] = {
        "name": attendee.name or "",
        "email": recipient_email or attendee.email or "",
        "roll_number": attendee.roll_number or "",
        "unique_id": attendee.unique_id or "",
        "qr_url": attendee.qr_url or "",
        "pass_url": attendee.pass_url or "",
    }

    for key, val in (attendee.extra_data or {}).items():
        values[_normalize_key(str(key))] = "" if val is None else str(val)

    if question_by_id:
        for fr in (attendee.form_responses or []):
            q = question_by_id.get(str(fr.question_id))
            if not q:
                continue
            values[_normalize_key(q.question_text or str(fr.question_id))] = fr.response_value or ""

    def replace_token(match):
        token = _normalize_key(match.group(1))
        return values.get(token, "")

    return re.sub(r"\{\{\s*([a-zA-Z0-9_\-\s]+)\s*\}\}", replace_token, template or "")


def _send_via_gmail_smtp(
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_app_password: str,
    to_email: str,
    subject: str,
    html: str,
) -> None:
    msg = MIMEText(html or "", "html", "utf-8")
    msg["Subject"] = subject or ""
    msg["From"] = smtp_user
    msg["To"] = to_email

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, int(smtp_port), timeout=30) as server:
        server.starttls(context=context)
        server.login(smtp_user, smtp_app_password)
        server.sendmail(smtp_user, [to_email], msg.as_string())


def _build_pass_svg(merged_html: str, background_url: str | None = None) -> str:

    text_only = re.sub(r"<[^>]+>", "", merged_html or "")
    lines = [x.strip() for x in text_only.splitlines() if x.strip()]
    if len(lines) == 0:
        lines = ["Event Pass"]

    y = 80
    text_nodes = []
    for line in lines[:14]:
        text_nodes.append(
            f"<text x='40' y='{y}' fill='#0f172a' font-family='Arial' font-size='18'>{escape(line)}</text>"
        )
        y += 32

    bg = ""
    if background_url:
        bg = (
            "<image href='{url}' x='0' y='0' width='1200' height='675' preserveAspectRatio='xMidYMid slice' />"
            .format(url=escape(background_url))
        )

    return (
        "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>"
        "<rect width='1200' height='675' fill='#f8fafc'/>"
        f"{bg}"
        "<rect x='20' y='20' width='1160' height='635' rx='24' ry='24' fill='white' fill-opacity='0.87' stroke='#cbd5e1'/>"
        + "".join(text_nodes)
        + "</svg>"
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _token_has(template: str, token: str) -> bool:
    return token in (template or "")


def _build_aligned_pass_svg(
    template_html: str,
    attendee: Attendee,
    background_url: str | None = None,
) -> str:
    # "Perfect alignment": fixed coordinates for name, ID, and QR.
    template_html = template_html or ""

    name_val = escape(attendee.name or "")
    id_val = escape(attendee.unique_id or attendee.roll_number or "")
    email_val = escape(attendee.email or "")

    qr_val = attendee.qr_url or ""

    show_name = _token_has(template_html, "{{name}}") or _token_has(template_html, "{{full_name}}")
    show_id = (
        _token_has(template_html, "{{unique_id}}")
        or _token_has(template_html, "{{roll_number}}")
        or _token_has(template_html, "{{id}}")
    )
    show_email = _token_has(template_html, "{{email}}")
    show_qr = _token_has(template_html, "{{qr_url}}") or _token_has(template_html, "{{qr}}")

    bg = ""
    if background_url:
        bg = (
            "<image href='{url}' x='0' y='0' width='1200' height='675' preserveAspectRatio='xMidYMid slice' />"
            .format(url=escape(background_url))
        )

    name_node = ""
    if show_name:
        name_node = (
            "<text x='90' y='240' fill='#0f172a' font-family='Arial' font-size='34' font-weight='700'>"
            f"{name_val}</text>"
        )

    id_node = ""
    if show_id:
        id_node = (
            "<text x='90' y='315' fill='#0f172a' font-family='Arial' font-size='26' font-weight='600'>"
            f"ID: {id_val}</text>"
        )

    email_node = ""
    if show_email and email_val:
        email_node = (
            "<text x='90' y='385' fill='#334155' font-family='Arial' font-size='20' font-weight='500'>"
            f"{email_val}</text>"
        )

    qr_node = ""
    if show_qr:
        if qr_val:
            qr_node = (
                f"<image href='{escape(qr_val)}' x='860' y='210' width='250' height='250' preserveAspectRatio='xMidYMid meet' />"
            )
        else:
            qr_node = (
                "<rect x='860' y='210' width='250' height='250' rx='16' ry='16' fill='#e2e8f0' stroke='#94a3b8' />"
                "<text x='935' y='350' fill='#475569' font-family='Arial' font-size='18' font-weight='600'>QR</text>"
            )

    return (
        "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>"
        "<rect width='1200' height='675' fill='#f8fafc'/>"
        f"{bg}"
        "<rect x='20' y='20' width='1160' height='635' rx='24' ry='24' fill='white' fill-opacity='0.87' stroke='#cbd5e1'/>"
        f"{name_node}{id_node}{email_node}{qr_node}"
        "</svg>"
    )


@router.post("/{event_id}/mailing/upload-pass-template")

def upload_pass_template(

    event_id: str,

    pass_template: UploadFile = File(...),

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    url = upload_file_to_s3(pass_template, f"events/{event_id}/pass_templates")

    ev.pass_template_url = url

    db.commit()

    return {"status": "ok", "pass_template_url": url}


@router.post("/{event_id}/mailing/generate-passes")

def generate_passes(

    event_id: str,

    merge_html: str = Form(...),

    pass_template: UploadFile | None = File(None),

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    template_bg = ev.pass_template_url or ""

    if pass_template:

        template_bg = upload_file_to_s3(

            pass_template,

            f"events/{event_id}/pass_templates"

        )

        ev.pass_template_url = template_bg

        db.commit()

    def generate_stream():

        attendees = db.query(Attendee).filter(Attendee.event_id == event_id).all()

        # Do not regenerate for those already generated.
        needed = []
        for a in attendees:
            if not a.unique_id:
                a.unique_id = uuid.uuid4().hex[:16]
            # Do not regenerate passes that already exist.
            if not a.pass_url:
                needed.append(a)

        total = len(needed)
        done = 0

        yield _sse({"type": "start", "total": total, "done": 0, "remaining": total})

        for a in needed:
            # Ensure QR exists for the aligned QR box.
            if not a.qr_url:
                payload = f"{event_id}|{a.unique_id}"
                img = qrcode.make(payload)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                buf.seek(0)
                qr_url = upload_bytes_to_s3(
                    buf.getvalue(),
                    f"events/{event_id}/qr",
                    "png",
                    "image/png",
                )
                a.qr_url = qr_url
                db.commit()

            svg = _build_aligned_pass_svg(merge_html, a, template_bg or None)
            data = svg.encode("utf-8")

            pass_url = upload_bytes_to_s3(
                data,
                f"events/{event_id}/generated_passes",
                "svg",
                "image/svg+xml",
            )

            a.pass_url = pass_url
            db.commit()

            done += 1
            remaining = total - done

            yield _sse({
                "type": "progress",
                "email": a.email,
                "attendee_id": str(a.id),
                "done": done,
                "total": total,
                "remaining": remaining,
                "log": f"Pass generated for {a.email or a.id}",
            })

        yield _sse({"type": "done", "generated": done, "total": total})

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/{event_id}/mailing/generate-qr")

def generate_qr_codes(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    def generate_stream():

        attendees = db.query(Attendee).filter(Attendee.event_id == event_id).all()

        needed = []
        for a in attendees:
            if not a.unique_id:
                a.unique_id = uuid.uuid4().hex[:16]
            # Do not regenerate QR for those already generated.
            if not a.qr_url:
                needed.append(a)

        total = len(needed)
        done = 0

        yield _sse({"type": "start", "total": total, "done": 0, "remaining": total})

        for a in needed:
            payload = f"{event_id}|{a.unique_id}"
            img = qrcode.make(payload)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            url = upload_bytes_to_s3(
                buf.getvalue(),
                f"events/{event_id}/qr",
                "png",
                "image/png",
            )
            a.qr_url = url
            db.commit()

            done += 1
            remaining = total - done
            yield _sse({
                "type": "progress",
                "email": a.email,
                "attendee_id": str(a.id),
                "done": done,
                "total": total,
                "remaining": remaining,
                "log": f"QR generated for {a.email or a.name or a.id}",
            })

        yield _sse({"type": "done", "generated": done, "total": total})

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


class SendMailBody(BaseModel):

    campaign_type: str

    subject: str

    html_body: str

    attach_pass_link: bool = False
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_app_password: str


@router.post("/{event_id}/mailing/send")

def send_mails(

    event_id: str,

    body: SendMailBody,

    db: Session = Depends(get_db)

):

    if body.campaign_type not in ("pass_mail", "other"):

        raise HTTPException(400, "invalid_campaign_type")

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    BATCH_SIZE = 70

    def send_stream():
        attendees = db.query(Attendee).options(
            selectinload(Attendee.form_responses)
        ).filter(Attendee.event_id == event_id).all()
        questions = db.query(FormQuestion).filter(FormQuestion.event_id == event_id).all()
        question_by_id = {str(q.id): q for q in questions}

        if not body.smtp_host or not body.smtp_user or not body.smtp_app_password:
            raise HTTPException(400, "smtp_details_required")

        delivery = "gmail_smtp"

        # Only count those that will actually be attempted (remaining recipients)
        eligible = []
        for a in attendees:
            recipient_email = _resolve_recipient_email(a, question_by_id)
            if not recipient_email:
                continue
            if body.campaign_type == "pass_mail" and (a.pass_mail_status or "") == "sent":
                continue
            if body.campaign_type == "other" and (a.other_mail_status or "") == "sent":
                continue
            eligible.append(a)

        total = len(eligible)
        done = 0
        sent = 0
        failed = 0
        skipped = 0
        log_lines: list[str] = []

        yield _sse({"type": "start", "total": total, "done": 0, "remaining": total, "delivery": delivery})

        for i, a in enumerate(attendees):
            recipient_email = _resolve_recipient_email(a, question_by_id)
            # skip: no email
            if not recipient_email:
                skipped += 1
                line = f"skip_no_email:{a.id}"
                log_lines.append(line)
                if body.campaign_type == "pass_mail":
                    a.pass_mail_status = "skipped_no_email"
                else:
                    a.other_mail_status = "skipped_no_email"
                db.commit()
                yield _sse({"type": "log", "log": line, "skipped": skipped})
                continue

            # skip: already sent
            if body.campaign_type == "pass_mail" and (a.pass_mail_status or "") == "sent":
                skipped += 1
                line = f"skip_already_sent_pass:{a.email}"
                log_lines.append(line)
                yield _sse({"type": "log", "log": line, "skipped": skipped})
                continue
            if body.campaign_type == "other" and (a.other_mail_status or "") == "sent":
                skipped += 1
                line = f"skip_already_sent_other:{a.email}"
                log_lines.append(line)
                yield _sse({"type": "log", "log": line, "skipped": skipped})
                continue

            html = _merge_placeholders(body.html_body, a, question_by_id, recipient_email=recipient_email)
            subject_final = _merge_placeholders(
                body.subject,
                a,
                question_by_id,
                recipient_email=recipient_email,
            )

            ok = False
            try:
                _send_via_gmail_smtp(
                    smtp_host=body.smtp_host.strip(),
                    smtp_port=body.smtp_port or 587,
                    smtp_user=body.smtp_user.strip(),
                    smtp_app_password=body.smtp_app_password,
                    to_email=recipient_email,
                    subject=subject_final,
                    html=html,
                )
                ok = True
                line = f"sent:{recipient_email}"
                log_lines.append(line)
            except Exception as e:
                ok = False
                line = f"fail:{recipient_email}:{str(e)}"
                log_lines.append(line)

            status = "sent" if ok else "failed"
            if body.campaign_type == "pass_mail":
                a.pass_mail_status = status
            else:
                a.other_mail_status = status
            db.commit()

            done += 1
            remaining = max(total - done, 0)
            if ok:
                sent += 1
            else:
                failed += 1

            yield _sse(
                {
                    "type": "progress",
                    "email": recipient_email,
                    "done": done,
                    "total": total,
                    "remaining": remaining,
                    "sent": sent,
                    "failed": failed,
                    "skipped": skipped,
                    "log": line,
                }
            )

            if done % BATCH_SIZE == 0 and remaining > 0:
                yield _sse(
                    {
                        "type": "batch",
                        "batch_size": BATCH_SIZE,
                        "done": done,
                        "total": total,
                        "remaining": remaining,
                        "sent": sent,
                        "failed": failed,
                        "skipped": skipped,
                    }
                )

        campaign = MailingCampaign(
            id=uuid.uuid4(),
            event_id=event_id,
            campaign_type=body.campaign_type,
            subject=body.subject,
            html_body=body.html_body,
            attachment_urls=[],
            log_lines=log_lines,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(campaign)
        db.commit()

        yield _sse(
            {
                "type": "done",
                "status": "ok",
                "delivery": delivery,
                "sent": sent,
                "failed": failed,
                "skipped": skipped,
                "total": total,
                "log_count": len(log_lines),
            }
        )

    return StreamingResponse(
        send_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.get("/{event_id}/mailing/campaigns")

def list_campaigns(

    event_id: str,

    db: Session = Depends(get_db)

):

    rows = db.query(MailingCampaign).filter(

        MailingCampaign.event_id == event_id

    ).order_by(

        MailingCampaign.created_at.desc()

    ).limit(50).all()

    return [

        {

            "id": str(r.id),

            "campaign_type": r.campaign_type,

            "subject": r.subject,

            "created_at": r.created_at.isoformat() if r.created_at else None,

            "log_lines": r.log_lines or [],

        }

        for r in rows

    ]
