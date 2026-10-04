from fastapi import Request, status
from fastapi.responses import JSONResponse

class LioraException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ConfigurationError(LioraException):
    def __init__(self, message: str):
        super().__init__("CONFIGURATION_ERROR", message, status.HTTP_500_INTERNAL_SERVER_ERROR)

class DatabaseError(LioraException):
    def __init__(self, message: str):
        super().__init__("DATABASE_ERROR", message, status.HTTP_500_INTERNAL_SERVER_ERROR)

async def liora_exception_handler(request: Request, exc: LioraException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
