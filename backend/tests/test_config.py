from app.core.config import Settings
import pytest
from pydantic import ValidationError

def test_missing_config(test_user):
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
