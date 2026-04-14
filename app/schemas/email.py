import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.models.email import EmailStatus

class EmailTemplateCreate(BaseModel):
    key: str
    subject: str
    body: str
    variables: Optional[List[str]] = []
    is_active: Optional[bool] = True

class EmailTemplateUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None

class EmailTemplateResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    key: str
    subject: str
    body: str
    variables: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EmailQueueResponse(BaseModel):
    id: uuid.UUID
    recipient_email: str
    template_key: str
    status: EmailStatus
    scheduled_at: datetime
    error_message: Optional[str] = None
    retry_count: int
    
    model_config = ConfigDict(from_attributes=True)
