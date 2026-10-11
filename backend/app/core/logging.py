import logging
from .config import settings

def setup_logging():
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger("liora")
    return logger

logger = setup_logging()

class AuditLogger:
    @staticmethod
    def log(event: str, user_id: str = None, details: dict = None):
        """Structured audit logging for security events."""
        audit_msg = f"AUDIT_EVENT={event}"
        if user_id:
            audit_msg += f" USER_ID={user_id}"
        if details:
            # Mask sensitive values explicitly just in case
            safe_details = details.copy()
            for key in ["password", "password_hash", "token", "secret", "api_key"]:
                if key in safe_details:
                    safe_details[key] = "***"
            audit_msg += f" DETAILS={safe_details}"
        logger.info(audit_msg)
