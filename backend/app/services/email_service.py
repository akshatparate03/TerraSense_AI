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


def send_landslide_alert_email(
    to_email: str,
    location_label: str,
    latitude: float,
    longitude: float,
    radius_km: float,
    probability: float,
    risk_level: str,
    features: dict,
    risk_drivers: list[dict],
    timestamp_iso: str,
) -> bool:
    """Spec section 41 alert content: location, radius, risk, contributing
    model features, and a plain disclaimer. Language is deliberately
    non-sensational ('Estimated landslide risk', never 'will happen') per
    spec sections 24-26/93."""
    subject = f"TerraSense AI — {risk_level} landslide risk near {location_label}"

    driver_rows = "".join(
        f"<tr><td style='padding:4px 0;color:#94a3b8;'>{d['feature'].replace('_', ' ').title()}</td>"
        f"<td style='padding:4px 0;text-align:right;color:#e2e8f0;'>{d.get('value', '—')}</td></tr>"
        for d in (risk_drivers or [])[:6]
    )

    level_color = {"HIGH": "#f87171", "WARNING": "#fbbf24", "MEDIUM": "#fbbf24"}.get(risk_level, "#38bdf8")

    body = _wrap_template(f"""
      <p style="margin-top:0;">TerraSense AI's background monitoring detected an elevated estimated
      landslide risk for a location you're monitoring.</p>

      <table role="presentation" width="100%" style="margin:18px 0;">
        <tr><td style="color:#94a3b8;">Location</td><td style="text-align:right;color:#e2e8f0;">{location_label}</td></tr>
        <tr><td style="color:#94a3b8;">Coordinates</td><td style="text-align:right;color:#e2e8f0;">{latitude:.4f}, {longitude:.4f}</td></tr>
        <tr><td style="color:#94a3b8;">Analysis Radius</td><td style="text-align:right;color:#e2e8f0;">{radius_km} km</td></tr>
        <tr><td style="color:#94a3b8;">Estimated Risk</td>
            <td style="text-align:right;font-weight:bold;color:{level_color};">{probability*100:.1f}% ({risk_level})</td></tr>
      </table>

      <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">Important model features for this estimate:</p>
      <table role="presentation" width="100%" style="margin-bottom:18px;">{driver_rows}</table>

      <p style="color:#94a3b8;font-size:12px;">Timestamp: {timestamp_iso}</p>

      <div style="margin-top:18px;padding:12px 16px;background:#111827;border-radius:10px;border:1px solid #1f2937;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
          This is an AI-generated risk <b>estimate</b>, not a guarantee that a landslide will occur, and not a
          certified government warning. Please follow official local emergency guidance where applicable.
        </p>
      </div>
    """)
    return _send_via_apps_script(to_email, subject, body)

def send_contact_form_email(name: str, from_email: str, sender_type: str, message: str) -> bool:
    """Forwards a public "Contact Us" form submission to CONTACT_FORM_TO_EMAIL
    via the same Apps Script webhook used for OTP/reset/alert emails."""
    if not settings.CONTACT_FORM_TO_EMAIL:
        logger.warning(
            "CONTACT_FORM_TO_EMAIL not configured - contact message NOT sent. "
            f"From {name} <{from_email}> ({sender_type}): {message!r}"
        )
        return False

    subject = f"TerraSense AI — New contact message from {name}"
    safe_message = message.replace("\n", "<br/>")
    body = _wrap_template(f"""
      <p style="margin-top:0;">New message submitted through the TerraSense AI Contact page:</p>
      <table role="presentation" width="100%" style="margin:14px 0;">
        <tr><td style="color:#94a3b8;padding:4px 0;">Name</td><td style="text-align:right;color:#e2e8f0;">{name}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Email</td><td style="text-align:right;color:#e2e8f0;">{from_email}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Type</td><td style="text-align:right;color:#e2e8f0;">{sender_type}</td></tr>
      </table>
      <div style="margin-top:8px;padding:14px 16px;background:#111827;border-radius:10px;border:1px solid #1f2937;">
        <p style="margin:0;color:#cbd5e1;font-size:13px;line-height:1.6;">{safe_message}</p>
      </div>
    """)
    return _send_via_apps_script(settings.CONTACT_FORM_TO_EMAIL, subject, body)
