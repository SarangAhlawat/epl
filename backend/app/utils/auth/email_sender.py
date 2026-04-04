import resend

from app.config import settings


resend.api_key = settings.RESEND_API_KEY


def send_verification_email(
    email,
    otp
):

    resend.Emails.send({

        "from":
        "noreply@ecellcgc.in",

        "to": email,

        "subject":
        "Verify Your Email",

        "html":

        f"""

        <h2>Email Verification</h2>

        <p>Your OTP:</p>

        <h1>{otp}</h1>

        """

    })