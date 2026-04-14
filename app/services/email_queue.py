import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.email import EmailQueue, EmailStatus

async def enqueue_email(
    db: AsyncSession, 
    company_id: uuid.UUID, 
    recipient_email: str, 
    template_key: str, 
    candidate_id: uuid.UUID = None,
    scheduled_at: datetime = None
) -> EmailQueue | None:
    if scheduled_at is None:
        scheduled_at = datetime.now(timezone.utc)
        
    # Deduplication check
    existing = await db.execute(
        select(EmailQueue).where(
            EmailQueue.company_id == company_id,
            EmailQueue.recipient_email == recipient_email,
            EmailQueue.template_key == template_key,
            EmailQueue.status.in_([EmailStatus.PENDING, EmailStatus.PROCESSING, EmailStatus.SENT])
        )
    )
    if existing.scalars().first():
        return None # Idempotent by design
        
    queue_item = EmailQueue(
        company_id=company_id,
        candidate_id=candidate_id,
        recipient_email=recipient_email,
        template_key=template_key,
        scheduled_at=scheduled_at,
        status=EmailStatus.PENDING
    )
    db.add(queue_item)
    await db.commit()
    await db.refresh(queue_item)
    return queue_item

async def cancel_pending_followups(db: AsyncSession, candidate_id: uuid.UUID):
    await db.execute(
        update(EmailQueue)
        .where(
            EmailQueue.candidate_id == candidate_id,
            EmailQueue.status == EmailStatus.PENDING,
            EmailQueue.template_key == 'followup'
        )
        .values(status=EmailStatus.CANCELED)
    )
    await db.commit()
