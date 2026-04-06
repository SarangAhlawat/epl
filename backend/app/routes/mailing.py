import datetime
import io
import uuid
import qrcode
from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendee import Attendee
from app.models.event import Event
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


def _merge_placeholders(template: str, attendee: Attendee) -> str:

    mapping = {

        "{{name}}": attendee.name or "",

        "{{email}}": attendee.email or "",

        "{{roll_number}}": attendee.roll_number or "",

        "{{unique_id}}": attendee.unique_id or "",

    }

    out = template

    for k, v in mapping.items():

        out = out.replace(k, v)

    return out


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

    attendees = db.query(Attendee).filter(Attendee.event_id == event_id).all()

    log = []

    for a in attendees:

        if not a.unique_id:

            a.unique_id = uuid.uuid4().hex[:16]

        body = _merge_placeholders(merge_html, a)

        if template_bg and "{{pass_template_url}}" in body:

            body = body.replace("{{pass_template_url}}", template_bg)

        elif template_bg and "background" not in body.lower():

            body = (

                f"<div style=\"min-height:400px;background:url('{template_bg}') "

                "center/cover no-repeat;padding:24px;\">"

                f"{body}</div>"

            )

        data = body.encode("utf-8")

        url = upload_bytes_to_s3(

            data,

            f"events/{event_id}/generated_passes",

            "html",

            "text/html; charset=utf-8"

        )

        a.pass_url = url

        log.append(f"Pass generated for {a.email or a.id}")

    db.commit()

    return {"status": "ok", "generated": len(attendees), "log": log}


@router.post("/{event_id}/mailing/generate-qr")

def generate_qr_codes(

    event_id: str,

    db: Session = Depends(get_db)

):

    ev = db.query(Event).filter(Event.id == event_id).first()

    if not ev:

        raise HTTPException(404, "event_not_found")

    attendees = db.query(Attendee).filter(Attendee.event_id == event_id).all()

    log = []

    for a in attendees:

        if not a.unique_id:

            a.unique_id = uuid.uuid4().hex[:16]

        payload = f"{event_id}|{a.unique_id}"

        img = qrcode.make(payload)

        buf = io.BytesIO()

        img.save(buf, format="PNG")

        buf.seek(0)

        url = upload_bytes_to_s3(

            buf.getvalue(),

            f"events/{event_id}/qr",

            "png",

            "image/png"

        )

        a.qr_url = url

        log.append(f"QR for {a.email or a.name or a.id}")

    db.commit()

    return {"status": "ok", "generated": len(attendees), "log": log}


class SendMailBody(BaseModel):

    campaign_type: str

    subject: str

    html_body: str

    attach_pass_link: bool = False


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

    attendees = db.query(Attendee).filter(Attendee.event_id == event_id).all()

    log_lines = []

    sent = 0

    api_key = None

    if resend is not None:

        from app.config import settings

        api_key = settings.RESEND_API_KEY

    for a in attendees:

        if not a.email:

            log_lines.append(f"skip_no_email:{a.id}")

            if body.campaign_type == "pass_mail":

                a.pass_mail_status = "skipped_no_email"

            else:

                a.other_mail_status = "skipped_no_email"

            continue

        html = _merge_placeholders(body.html_body, a)

        if body.attach_pass_link and a.pass_url:

            html += (

                f"<p><a href=\"{a.pass_url}\">Download your pass</a></p>"

            )

        if body.attach_pass_link and a.qr_url:

            html += (

                f"<p><img src=\"{a.qr_url}\" alt=\"QR\" style=\"max-width:200px;\" /></p>"

            )

        ok = False

        if api_key:

            try:

                resend.Emails.send({

                    "from": "noreply@ecellcgc.in",

                    "to": a.email,

                    "subject": _merge_placeholders(body.subject, a),

                    "html": html,

                })

                ok = True

                log_lines.append(f"sent:{a.email}")

            except Exception as e:

                log_lines.append(f"fail:{a.email}:{str(e)}")

        else:

            ok = True

            log_lines.append(f"simulated_sent:{a.email}")

        status = "sent" if ok else "failed"

        if body.campaign_type == "pass_mail":

            a.pass_mail_status = status

        else:

            a.other_mail_status = status

        if ok:

            sent += 1

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

    return {

        "status": "ok",

        "sent": sent,

        "total": len(attendees),

        "log": log_lines,

        "delivery": "resend" if api_key else "simulated",

    }


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
