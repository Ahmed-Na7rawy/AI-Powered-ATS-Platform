import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional
from app.models.candidate import StatusUpdate

class GenerateLinkRequest(BaseModel):
    job_id: str

class GenerateLinkResponse(BaseModel):
    token: str
    expires_at: datetime
    url: str

class CandidateLinkOut(BaseModel):
    job_id: str
    token: str
    expires_at: datetime
    
    class Config:
        from_attributes = True

class CandidateApplyRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class CandidateResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    job_id: str
    email: str
    first_name: str
    last_name: str
    resume_path: str
    status: StatusUpdate
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class StatusUpdateRequest(BaseModel):
    status: StatusUpdate

class CandidateActivityResponse(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    activity_type: str
    details: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
