from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user, get_ai_service
from app.services.ai_base import AIService
from app.models.hr_user import HRUser
from app.schemas.ai import GenerateTemplateRequest, ImproveJDRequest, SummarizeResumeRequest, StringContentResponse

router = APIRouter()

@router.post("/generate-template", response_model=StringContentResponse)
async def ai_generate_template(
    payload: GenerateTemplateRequest,
    current_user: HRUser = Depends(get_current_user),
    ai_svc: AIService = Depends(get_ai_service)
):
    content = await ai_svc.generate_template(payload.type, payload.context)
    return {"content": content}

@router.post("/improve-jd", response_model=StringContentResponse)
async def ai_improve_jd(
    payload: ImproveJDRequest,
    current_user: HRUser = Depends(get_current_user),
    ai_svc: AIService = Depends(get_ai_service)
):
    content = await ai_svc.improve_jd(payload.job_description)
    return {"content": content}

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.database import get_db
from app.models.organization import Job
from app.models.candidate import Candidate
from app.schemas.ai import SummarizeResumeResponse
from app.services.extractor import extract_text_from_file

@router.post("/summarize-resume", response_model=SummarizeResumeResponse)
async def ai_summarize_resume(
    payload: SummarizeResumeRequest,
    current_user: HRUser = Depends(get_current_user),
    ai_svc: AIService = Depends(get_ai_service),
    db: AsyncSession = Depends(get_db)
):
    # Lookup Candidate securely 
    res = await db.execute(
        select(Candidate)
        .where(
            Candidate.id == payload.candidate_id,
            Candidate.company_id == current_user.company_id
        )
    )
    candidate = res.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    if not candidate.resume_path:
        raise HTTPException(status_code=400, detail="Candidate has no associated resume file to summarize")
        
    job_res = await db.execute(select(Job).where(Job.id == uuid.UUID(candidate.job_id)))
    job = job_res.scalar_one_or_none()
    job_context = f"Title: {job.title}\nRequirements: {job.requirements}" if job else "Unknown job context."
        
    try:
        extracted_text = extract_text_from_file(candidate.resume_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document natively: {str(e)}")
        
    try:
        ai_result = await ai_svc.summarize_resume(extracted_text, job_context)
        return ai_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")
