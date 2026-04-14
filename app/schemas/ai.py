from pydantic import BaseModel

class GenerateTemplateRequest(BaseModel):
    type: str
    context: str

class StringContentResponse(BaseModel):
    content: str

class ImproveJDRequest(BaseModel):
    job_description: str

import uuid

class SummarizeResumeRequest(BaseModel):
    candidate_id: uuid.UUID

class SummarizeResumeResponse(BaseModel):
    score: int
    content: str
