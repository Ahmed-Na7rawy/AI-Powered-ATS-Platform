from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import List

from app.api.dependencies import get_db, get_current_user
from app.models.hr_user import HRUser
from app.models.candidate import Candidate, CandidateActivity, CandidateLink, StatusUpdate
from app.models.company import Company
from app.schemas.candidate import GenerateLinkRequest, GenerateLinkResponse, CandidateResponse, StatusUpdateRequest, CandidateActivityResponse, CandidateLinkOut
from app.schemas.company import CompanySettingsUpdate, CompanySettingsResponse, HRUserResponse, HRUserInvite, HRUserUpdate
from app.api.routers.auth import get_password_hash
from app.services.extractor import extract_text_from_file
from app.services.email_queue import cancel_pending_followups
from app.database import get_db

router = APIRouter()

@router.get("/settings", response_model=CompanySettingsResponse)
async def get_settings(current_user: HRUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Company).where(Company.id == current_user.company_id))
    return res.scalar_one()

@router.put("/settings", response_model=CompanySettingsResponse)
async def update_settings(payload: CompanySettingsUpdate, current_user: HRUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = res.scalar_one()
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)
        
    await db.commit()
    await db.refresh(company)
    return company

@router.get("/users", response_model=list[HRUserResponse])
async def list_users(current_user: HRUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(HRUser).where(HRUser.company_id == current_user.company_id))
    return res.scalars().all()

@router.post("/users/invite", response_model=HRUserResponse)
async def invite_hr_user(
    payload: HRUserInvite,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can invite new users to the organization.")
        
    check = await db.execute(select(HRUser).where(HRUser.email == payload.email))
    if check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
        
    new_user = HRUser(
        company_id=current_user.company_id,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        is_admin=payload.is_admin
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=HRUserResponse)
async def update_hr_user(
    user_id: uuid.UUID,
    payload: HRUserUpdate,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update users.")
        
    result = await db.execute(select(HRUser).where(HRUser.id == user_id, HRUser.company_id == current_user.company_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payload.email is not None:
        user.email = payload.email
    if payload.is_admin is not None:
        user.is_admin = payload.is_admin
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None:
        user.password_hash = get_password_hash(payload.password)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_hr_user(
    user_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete users.")
        
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself.")
        
    result = await db.execute(select(HRUser).where(HRUser.id == user_id, HRUser.company_id == current_user.company_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.get("/me")
async def read_users_me(current_user: HRUser = Depends(get_current_user)):
    return {
        "id": current_user.id, 
        "email": current_user.email, 
        "company_id": current_user.company_id
    }

@router.get("/links", response_model=list[CandidateLinkOut])
async def list_candidate_links(
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CandidateLink)
        .where(CandidateLink.company_id == current_user.company_id)
        .order_by(CandidateLink.created_at.desc())
    )
    return result.scalars().all()

@router.post("/links", response_model=GenerateLinkResponse)
async def create_candidate_link(
    request: GenerateLinkRequest,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    link = CandidateLink(
        company_id=current_user.company_id,
        job_id=request.job_id,
        token=token,
        expires_at=expires_at
    )
    db.add(link)
    await db.commit()
    
    return {
        "token": token,
        "expires_at": expires_at,
        "url": f"https://example.com/apply/{token}" # Placeholder base
    }

@router.get("/candidates", response_model=list[CandidateResponse])
async def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    valid_sorts = ["created_at", "updated_at", "first_name", "last_name", "status"]
    sort_field = Candidate.created_at
    if sort_by in valid_sorts:
        sort_field = getattr(Candidate, sort_by)
        
    order = sort_field.desc() if sort_desc else sort_field.asc()

    result = await db.execute(
        select(Candidate)
        .where(Candidate.company_id == current_user.company_id)
        .order_by(order)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/candidates/{candidate_id}/activities", response_model=list[CandidateActivityResponse])
async def get_candidate_activities(
    candidate_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check = await db.execute(select(Candidate.id).where(Candidate.id == candidate_id, Candidate.company_id == current_user.company_id))
    if not check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    res = await db.execute(select(CandidateActivity).where(CandidateActivity.candidate_id == candidate_id).order_by(CandidateActivity.created_at.desc()))
    return res.scalars().all()

@router.get("/candidates/{candidate_id}/resume.pdf")
async def get_candidate_resume(
    candidate_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id, Candidate.company_id == current_user.company_id))
    candidate = result.scalar_one_or_none()
    
    if not candidate or not candidate.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    ext = candidate.resume_path.lower().split('.')[-1]
    media_type = "application/pdf"
    if ext in ["doc", "docx"]:
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    import os
    if not os.path.exists(candidate.resume_path):
        raise HTTPException(status_code=404, detail="File missing on server")

    return FileResponse(
        candidate.resume_path, 
        media_type=media_type, 
        filename=os.path.basename(candidate.resume_path),
        content_disposition_type="inline"
    )

@router.get("/candidates/{candidate_id}/resume/text")
async def get_candidate_resume_text(
    candidate_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id, Candidate.company_id == current_user.company_id))
    candidate = result.scalar_one_or_none()
    
    if not candidate or not candidate.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    try:
        text = extract_text_from_file(candidate.resume_path)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.put("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: uuid.UUID,
    request: StatusUpdateRequest,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Candidate)
        .where(
            Candidate.id == candidate_id, 
            Candidate.company_id == current_user.company_id
        )
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    if candidate.status != request.status:
        activity = CandidateActivity(
            candidate_id=candidate.id,
            activity_type="STATUS_CHANGE",
            details=f"Status changed from {candidate.status} to {request.status}"
        )
        db.add(activity)
        
    candidate.status = request.status
    await cancel_pending_followups(db, candidate.id)
    await db.commit()
    
    return {"message": "Status updated successfully", "status": request.status}
