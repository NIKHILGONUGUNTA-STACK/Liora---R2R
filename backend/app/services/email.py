import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.logging import AuditLogger

class EmailService:
    @staticmethod
    def send_otp_email(recipient_email: str, otp_code: str, purpose: str = "create") -> bool:
        """
        Sends an enterprise-grade HTML verification email to the user.
        Supports standard SMTP (Gmail, SendGrid, Amazon SES, Mailgun, etc.)
        configured via app settings / environment variables.
        """
        smtp_host = settings.SMTP_HOST
        smtp_port = settings.SMTP_PORT
        smtp_user = settings.SMTP_USER.strip() if settings.SMTP_USER else ""
        smtp_password = settings.SMTP_PASSWORD.replace(" ", "").strip() if settings.SMTP_PASSWORD else ""
        smtp_from = settings.SMTP_FROM or smtp_user or "noreply.liora@gmail.com"

        is_reset = purpose == "reset"
        subject = f"Your Liora Password Reset Code: {otp_code}" if is_reset else f"Your Liora Verification Code: {otp_code}"
        badge_title = "Password Reset" if is_reset else "Account Verification"
        heading = "Reset your password" if is_reset else "Verify your email address"
        body_intro = (
            "We received a request to reset the password for your Liora account. "
            "Please enter the one-time code below to proceed with resetting your password."
            if is_reset
            else "Welcome to Liora. To complete your account registration and secure your profile, "
            "enter the one-time verification code below into the authentication screen."
        )

        # Production-grade HTML Email Template with Liora Design & Plus Jakarta Sans typography
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    }}
    .header-bar {{
      padding: 32px 36px 20px 36px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .brand {{
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0b1c30;
      text-decoration: none;
    }}
    .brand-tag {{
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 4px 10px;
      border-radius: 9999px;
    }}
    .content {{
      padding: 36px;
    }}
    .heading {{
      font-size: 22px;
      font-weight: 800;
      color: #0b1c30;
      margin: 0 0 12px 0;
      letter-spacing: -0.02em;
    }}
    .body-text {{
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 28px 0;
    }}
    .otp-card {{
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin: 0 0 24px 0;
    }}
    .otp-code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #0b1c30;
      padding-left: 10px;
      display: inline-block;
    }}
    .otp-expiry {{
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-top: 10px;
    }}
    .security-notice {{
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
      margin-bottom: 28px;
    }}
    .security-notice strong {{
      color: #0b1c30;
    }}
    .footer {{
      background: #fafafa;
      border-top: 1px solid #f1f5f9;
      padding: 24px 36px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      color: #94a3b8;
    }}
    .footer a {{
      color: #64748b;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header-bar">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left">
            <span class="brand">LIORA</span>
          </td>
          <td align="right">
            <span class="brand-tag">{badge_title}</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="content">
      <h1 class="heading">{heading}</h1>
      <p class="body-text">{body_intro}</p>

      <div class="otp-card">
        <div class="otp-code">{otp_code}</div>
        <div class="otp-expiry">Valid for 10 minutes &bull; Single-use only</div>
      </div>

      <div class="security-notice">
        <strong>Security Notice:</strong> Never share this code with anyone. Liora security will never ask for your verification code. If you did not request this, you can safely disregard this email.
      </div>
    </div>

    <div class="footer">
      Deterministic Knowledge Engine &bull; Identity Protection<br>
      &copy; 2026 Liora Intelligence Systems. All rights reserved.
    </div>
  </div>
</body>
</html>"""

        plain_text = f"""LIORA - {badge_title.upper()}

{heading}
{body_intro}

Your One-Time Verification Code:
{otp_code}

This code expires in 10 minutes.
Security Notice: Never share this code with anyone.

(c) 2026 Liora Intelligence Systems. All rights reserved.
"""

        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"Liora Security <{smtp_from}>"
                msg["To"] = recipient_email

                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                        server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [recipient_email], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                        server.starttls()
                        server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [recipient_email], msg.as_string())

                AuditLogger.log("EMAIL_DISPATCHED_SMTP", details={"email": recipient_email, "purpose": purpose})
                return True
            except Exception as e:
                AuditLogger.log("EMAIL_DISPATCH_FAILURE", details={"email": recipient_email, "error": str(e)})
                print(f"[EmailService Error] Failed to send email via SMTP to {recipient_email}: {e}")
                return False
        else:
            # Fallback when SMTP password is not yet configured: audit logged securely
            AuditLogger.log("EMAIL_OTP_GENERATED_NO_SMTP_PASSWORD", details={"email": recipient_email, "purpose": purpose})
            print(f"[EmailService Notice] SMTP credentials awaiting password. Generated OTP for {recipient_email}: {otp_code}")
            return True
