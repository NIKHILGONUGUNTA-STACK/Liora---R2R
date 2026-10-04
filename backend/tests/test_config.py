from app.core.config import Settings
import pytest
from pydantic import ValidationError

def test_missing_config():
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
