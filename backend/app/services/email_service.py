from __future__ import annotations

import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

# Logo used in outgoing emails. Gmail/other clients fetch images by URL, so
# this must be a publicly reachable address -- it will only actually render
# once the frontend is deployed (e.g. to Netlify). Until then, email clients
# will just show a broken-image placeholder where the logo would be; the
# rest of the email still works fine.
LOGO_URL = f"{settings.FRONTEND_URL.rstrip('/')}/TerraSense_AI_Logo.png"


class EmailDeliveryError(RuntimeError):
    pass


def _send_via_apps_script(to_email: str, subject: str, body_html: str) -> bool:
    """Sends an email by POSTing to a Google Apps Script Web App URL.

    Setup (documented in full in README.md): create a doPost(e) Apps Script
    project that reads e.parameter.to/subject/body/secret, checks the secret,
    and calls MailApp.sendEmail(...); deploy as a Web App (execute as: Me,
    access: Anyone); put the resulting /exec URL in APPS_SCRIPT_EMAIL_URL.

    IMPORTANT: Apps Script Web Apps normally respond to a successful POST
    with an HTTP 302 redirect to a script.googleusercontent.com results page
    -- NOT a 200. If requests() is allowed to follow that redirect, doing so
    converts the POST into a GET (per HTTP redirect semantics) and that
    follow-up GET can itself return a non-2xx status (e.g. 404) *even though
    the original script already ran and the email was already sent*. That
    mismatch previously caused this function to report failure (and the API
    to return "Something went wrong") on emails that had, in fact, already
    been delivered. Fix: do not follow the redirect -- a 200 or a 302 from
    the initial /exec request both mean Apps Script accepted and ran the
    request.
    """
    if not settings.APPS_SCRIPT_EMAIL_URL:
        # No email backend configured (e.g. in local/dev/sandbox testing) -
        # log instead of failing so the rest of the auth flow can still be
        # exercised and inspected.
        logger.warning(
            "APPS_SCRIPT_EMAIL_URL not configured - email NOT sent. "
            f"Would have sent to={to_email} subject={subject!r}"
        )
        return False

    try:
        resp = requests.post(
            settings.APPS_SCRIPT_EMAIL_URL,
            data={
                "to": to_email,
                "subject": subject,
                "body": body_html,
                "secret": settings.APPS_SCRIPT_SHARED_SECRET,
            },
            timeout=15,
            allow_redirects=False,
        )
        if resp.status_code not in (200, 302):
            raise EmailDeliveryError(f"Apps Script email webhook returned HTTP {resp.status_code}")
        return True
    except requests.RequestException as e:
        raise EmailDeliveryError(f"Failed to reach email webhook: {e}") from e


def _wrap_template(inner_html: str) -> str:
    return f"""
    <div style="background-color:#05070a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background-color:#0d1117;border:1px solid #1b2333;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#22d3ee,#3b82f6);padding:22px 28px;">
          <table role="presentation" width="100%"><tr>
            <td style="vertical-align:middle;width:36px;">
              <img src="{LOGO_URL}" width="32" height="32" alt="TerraSense AI" style="display:block;border-radius:8px;" />
            </td>
            <td style="vertical-align:middle;padding-left:10px;">
              <span style="font-size:16px;font-weight:bold;color:#05070a;letter-spacing:0.3px;">TerraSense AI</span>
            </td>
          </tr></table>
          <div style="font-size:11px;color:#05070a;opacity:0.85;margin-top:4px;">Sense the Earth. Predict the Risk.</div>
        </div>
        <div style="padding:28px;color:#cbd5e1;font-size:14px;line-height:1.6;">
          {inner_html}
        </div>
        <div style="padding:16px 28px;border-top:1px solid #1b2333;color:#64748b;font-size:11px;">
          This is an automated message from TerraSense AI. Do not reply to this email.
        </div>
      </div>
    </div>
    """


def send_otp_email(to_email: str, name: str, otp: str) -> bool:
    subject = "TerraSense AI — Verify your email"
    body = _wrap_template(f"""
      <p>Hi {name},</p>
      <p>Your email verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color:#f1f5f9;">{otp}</p>
      <p>This code expires in {settings.OTP_EXPIRE_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
    """)
    delivered = _send_via_apps_script(to_email, subject, body)
    if not delivered:
        logger.warning(f"[DEV MODE] OTP for {to_email} is: {otp}")
    return delivered


def send_password_reset_email(to_email: str, name: str, reset_link: str) -> bool:
    subject = "TerraSense AI — Reset your password"
    body = _wrap_template(f"""
      <p>Hi {name},</p>
      <p>We received a request to reset your password. Click the button below to set a new one:</p>
      <p><a href="{reset_link}" style="display:inline-block;background:linear-gradient(90deg,#22d3ee,#3b82f6);color:#05070a;font-weight:bold;padding:10px 22px;border-radius:999px;text-decoration:none;">Reset Password</a></p>
      <p>This link expires in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
    """)
    return _send_via_apps_script(to_email, subject, body)