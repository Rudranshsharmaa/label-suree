import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.app.config import settings

logger = logging.getLogger("labelsure.email")

def send_password_reset_email(to_email: str, raw_reset_token: str) -> bool:
    """
    Dispatches a secure password reset email with the reset link.
    Guarantees that raw reset tokens are never written to production logs.
    """
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?token={raw_reset_token}"
    
    if settings.SMTP_ENABLED:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "LabelSure — Password Reset Request"
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = to_email

            text_content = (
                f"Hello,\n\n"
                f"We received a request to reset your LabelSure account password.\n"
                f"Click the link below to set a new password (valid for 15 minutes):\n\n"
                f"{reset_url}\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"— LabelSure Security Team"
            )
            html_content = f"""
            <div style="font-family: sans-serif; background-color: #F5F3EA; padding: 24px; color: #17231C;">
                <div style="max-width: 560px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #E2DED0;">
                    <h2 style="color: #123C2A; margin-top: 0;">Password Reset Request</h2>
                    <p>We received a request to reset your LabelSure account password.</p>
                    <p style="margin: 24px 0;">
                        <a href="{reset_url}" style="background-color: #123C2A; color: #F5F3EA; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p style="font-size: 13px; color: #5B6860;">This link is valid for 15 minutes. If you did not make this request, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #E2DED0; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #738077;">LabelSure Security Platform &copy; 2026</p>
                </div>
            </div>
            """

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            
            return True
        except Exception as e:
            logger.error("Failed to dispatch password reset email via SMTP")
            return False
    else:
        # Development Mock Delivery (Only in non-production environments)
        if settings.APP_ENV == "development":
            # For local debugging, indicate mock delivery without exposing in production logs
            print(f"[DEV MOCK EMAIL] Password reset requested for {to_email}. Reset link: {reset_url}")
        return True
