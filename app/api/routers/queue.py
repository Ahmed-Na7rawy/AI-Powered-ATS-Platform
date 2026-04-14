from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import uuid

from app.api.dependencies import get_current_user
from app.models.hr_user import HRUser
from app.models.email import EmailQueue, EmailStatus
from app.schemas.email import EmailQueueResponse
from app.database import get_db

router = APIRouter()

@router.get("/", response_model=list[EmailQueueResponse])
async def get_queue_monitor(
    skip: int = 0,
    limit: int = 50,
    status: EmailStatus | None = None,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(EmailQueue).where(EmailQueue.company_id == current_user.company_id)
    if status is not None:
        query = query.where(EmailQueue.status == status)
        
    query = query.order_by(desc(EmailQueue.scheduled_at)).offset(skip).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/{queue_id}/retry")
async def retry_queue_item(
    queue_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(EmailQueue).where(
            EmailQueue.id == queue_id,
            EmailQueue.company_id == current_user.company_id
        )
    )
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
        
    if item.status not in [EmailStatus.FAILED, EmailStatus.CANCELED]:
        raise HTTPException(status_code=400, detail="Cannot retry an item that is not FAILED or CANCELED")
        
    item.status = EmailStatus.PENDING
    item.retry_count = 0 
    item.retry_backoff_until = None
    item.error_message = None
    
    await db.commit()
    return {"message": "Item re-queued successfully"}
