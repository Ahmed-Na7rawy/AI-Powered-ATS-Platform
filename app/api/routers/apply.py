from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import logging
import uuid

from app.database import get_db
from app.models.candidate import CandidateLink, Candidate, StatusUpdate
from app.models.company import Company
from app.models.organization import Job
from app.services.resume import save_resume_file
from app.services.email_queue import enqueue_email
from app.limiter import limiter

router = APIRouter()

@router.get("/{token}")
async def get_apply_page_details(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CandidateLink).where(CandidateLink.token == token))
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    if link.is_used:
        raise HTTPException(status_code=410, detail="This application link has already been used.")
        
    expires = link.expires_at if link.expires_at.tzinfo else link.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This application link has expired.")

    # Fetch Job and Company
    try:
        job_uuid = uuid.UUID(link.job_id)
        job_result = await db.execute(select(Job).where(Job.id == job_uuid))
    except ValueError:
        # Fallback if link.job_id isn't a valid UUID string
        job_result = await db.execute(select(Job).where(Job.id == link.job_id))
        
    job = job_result.scalar_one_or_none()

    company_result = await db.execute(select(Company).where(Company.id == link.company_id))
    company = company_result.scalar_one_or_none()

    if not job or not company:
        raise HTTPException(status_code=404, detail="Job or company information missing.")

    return {
        "job_title": job.title,
        "job_description": job.description,
        "job_requirements": job.requirements,
        "company_name": company.name
    }

@router.post("/{token}")
@limiter.limit("5/minute")
async def apply_for_job(
    request: Request,
    token: str,
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    resume: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Lookup link
    result = await db.execute(select(CandidateLink).where(CandidateLink.token == token))
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    # Application guardrails: reject used or expired links with 410
    if link.is_used:
        raise HTTPException(status_code=410, detail="This application link has already been used.")
    # Handle both naive (SQLite) and aware (Postgres) datetimes
    expires = link.expires_at if link.expires_at.tzinfo else link.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This application link has expired.")
        
    # Duplicate guard: same email + job_id returns 409
    dup_check = await db.execute(
        select(Candidate).where(
            Candidate.company_id == link.company_id,
            Candidate.job_id == link.job_id,
            Candidate.email == email
        )
    )
    if dup_check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A candidate with this email has already applied for this job.")
        
    # Save resume
    resume_path = await save_resume_file(resume, link.company_id)
    
    # Create candidate
    candidate = Candidate(
        company_id=link.company_id,
        job_id=link.job_id,
        email=email,
        first_name=first_name,
        last_name=last_name,
        resume_path=resume_path,
        status=StatusUpdate.APPLIED
    )
    
    # Mark link as used
    link.is_used = True
    
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    
    await enqueue_email(db, link.company_id, email, "applied_thanks", candidate.id)
    
    return {"message": "Application submitted successfully", "candidate_id": candidate.id}
