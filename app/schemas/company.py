from pydantic import BaseModel
import uuid

class CompanySettingsUpdate(BaseModel):
    name: str | None = None
    website: str | None = None
    support_email: str | None = None
    smtp_host: str | None = None
    smtp_port: str | None = None
    smtp_password: str | None = None
    gemini_api_key: str | None = None

class CompanySettingsResponse(BaseModel):
    id: uuid.UUID
    name: str
    website: str | None = None
    support_email: str | None = None
    smtp_host: str | None = None
    smtp_port: str | None = None
    gemini_api_key: str | None = None
    
    class Config:
        from_attributes = True

class HRUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_admin: bool
    is_active: bool
    
    class Config:
        from_attributes = True

class HRUserInvite(BaseModel):
    email: str
    password: str
    is_admin: bool = False

class HRUserUpdate(BaseModel):
    email: str | None = None
    is_admin: bool | None = None
    is_active: bool | None = None
    password: str | None = None
