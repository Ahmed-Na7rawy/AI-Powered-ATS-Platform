from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api.dependencies import get_current_user
from app.models.hr_user import HRUser
from app.models.email import EmailTemplate
from app.schemas.email import EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateResponse
from app.database import get_db

router = APIRouter()

DEFAULT_TEMPLATES = [
    {"key": "applied_thanks", "subject": "Thanks for your application", "body": "We have received your application."},
    {"key": "followup", "subject": "Checking in", "body": "Are you still interested?"},
    {"key": "rejection", "subject": "Update on your application", "body": "Unfortunately, we are not moving forward."},
    {"key": "interview_invite", "subject": "Interview Invitation", "body": "We would like to interview you."}
]

@router.post("/seed", response_model=list[EmailTemplateResponse])
async def seed_default_templates(
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    created = []
    for default in DEFAULT_TEMPLATES:
        # Check if exists
        check = await db.execute(select(EmailTemplate).where(
            EmailTemplate.company_id == current_user.company_id,
            EmailTemplate.key == default["key"]
        ))
        if not check.scalar_one_or_none():
            t = EmailTemplate(
                company_id=current_user.company_id,
                **default
            )
            db.add(t)
            created.append(t)
    await db.commit()
    for t in created:
        await db.refresh(t)
        
    return created

@router.post("/", response_model=EmailTemplateResponse)
async def create_template(
    payload: EmailTemplateCreate,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check = await db.execute(select(EmailTemplate).where(
        EmailTemplate.company_id == current_user.company_id,
        EmailTemplate.key == payload.key
    ))
    if check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Template key already exists")
        
    t = EmailTemplate(company_id=current_user.company_id, **payload.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t

@router.get("/", response_model=list[EmailTemplateResponse])
async def get_templates(
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(EmailTemplate).where(EmailTemplate.company_id == current_user.company_id))
    return res.scalars().all()
