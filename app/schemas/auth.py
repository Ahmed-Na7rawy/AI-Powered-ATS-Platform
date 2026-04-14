import uuid
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    user_id: str | None = None
    company_id: str | None = None
