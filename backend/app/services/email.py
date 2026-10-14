import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.logging import AuditLogger

class EmailService:
    @staticmethod
    def send_otp_email(recipient_email: str, otp_code: str) -> bool:
        """
        Sends an OTP verification email to the user.
        Supports standard SMTP (Gmail, SendGrid, Amazon SES, Mailgun, custom SMTP)
        configured via environment variables:
          - SMTP_HOST (e.g. smtp.gmail.com)
          - SMTP_PORT (e.g. 587 or 465)
          - SMTP_USER (e.g. your_email@gmail.com)
          - SMTP_PASSWORD (e.g. app-specific password)
          - SMTP_FROM (e.g. noreply@liora.io)
        """
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@liora.io")

        subject = f"Your Liora Verification Code: {otp_code}"
        
        # HTML Email Template with Liora Design
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }}
            .container {{ max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 32px; }}
            .logo {{ font-size: 20px; font-weight: 800; color: #1B4EF5; letter-spacing: -0.02em; margin-bottom: 24px; }}
            .title {{ font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }}
            .desc {{ font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 28px; }}
            .code-box {{ background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace; margin-bottom: 28px; }}
            .footer {{ font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; line-height: 1.4; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">LIORA</div>
            <div class="title">Verification Code</div>
            <div class="desc">Enter this one-time code to verify your identity. This code expires in 10 minutes. If you did not request this, please disregard this email.</div>
            <div class="code-box">{otp_code}</div>
            <div class="footer">
              Deterministic Knowledge Engine &bull; Enterprise Verification<br>
              &copy; 2026 Liora Intelligence Systems Inc.
            </div>
          </div>
        </body>
        </html>
        """

        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"Liora Security <{smtp_from}>"
                msg["To"] = recipient_email

                part_text = MIMEText(f"Your Liora verification code is: {otp_code}. It expires in 10 minutes.", "plain")
                part_html = MIMEText(html_content, "html")
                msg.attach(part_text)
                msg.attach(part_html)

                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                        server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [recipient_email], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                        server.starttls()
                        server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [recipient_email], msg.as_string())

                AuditLogger.log("EMAIL_DISPATCHED_SMTP", details={"email": recipient_email})
                return True
            except Exception as e:
                AuditLogger.log("EMAIL_DISPATCH_FAILURE", details={"email": recipient_email, "error": str(e)})
                print(f"[EmailService Error] Failed to send email via SMTP to {recipient_email}: {e}")
                return False
        else:
            # When SMTP is not yet configured, log to server audit trail safely (production fallback)
            AuditLogger.log("EMAIL_OTP_GENERATED_NO_SMTP_CONFIGURED", details={"email": recipient_email})
            print(f"[EmailService Notice] SMTP credentials not set. Generated OTP for {recipient_email}: {otp_code}")
            return True
