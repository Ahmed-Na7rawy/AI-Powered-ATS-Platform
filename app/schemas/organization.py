from pydantic import BaseModel, Field
import uuid
from typing import Optional
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None

class DepartmentOut(DepartmentBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    department_id: uuid.UUID

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    department_id: Optional[uuid.UUID] = None

class JobOut(JobBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
