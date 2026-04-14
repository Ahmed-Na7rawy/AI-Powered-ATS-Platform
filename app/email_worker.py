import asyncio
import uuid
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session
from app.models.email import EmailQueue, EmailStatus, EmailTemplate
from app.celery_app import send_email_task
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EmailWorker")

shutdown_event = asyncio.Event()

import signal

def handle_shutdown(sig, loop):
    logger.info(f"Received signal {sig}. Initiating graceful shutdown...")
    shutdown_event.set()

async def reclaim_stale_locks(db: AsyncSession):
    # Re-claim rows where locked_at is older than 60s (crashed worker recovery)
    stale_threshold = datetime.now(timezone.utc) - timedelta(seconds=60)
    from sqlalchemy import update
    stmt = (
        update(EmailQueue)
        .where(
            EmailQueue.status == EmailStatus.PROCESSING,
            EmailQueue.locked_at < stale_threshold
        )
        .values(status=EmailStatus.PENDING, locked_by=None, locked_at=None)
    )
    await db.execute(stmt)
    await db.commit()

async def process_queue(worker_id: str):
    while not shutdown_event.is_set():
        async with async_session() as db:
            try:
                await reclaim_stale_locks(db)
                
                now = datetime.now(timezone.utc)
                
                # Use ORM query compatible with both SQLite and PostgreSQL
                res = await db.execute(
                    select(EmailQueue)
                    .where(
                        EmailQueue.status == EmailStatus.PENDING,
                        EmailQueue.scheduled_at <= now,
                    )
                    .order_by(EmailQueue.scheduled_at.asc())
                    .limit(1)
                )
                row = res.scalar_one_or_none()
                
                if row:
                    item = row
                    
                    item.status = EmailStatus.PROCESSING
                    item.locked_by = worker_id
                    item.locked_at = now
                    await db.commit()
                    
                    try:
                        # Fetch template to compile email
                        t_query = await db.execute(select(EmailTemplate).where(
                            EmailTemplate.company_id == item.company_id,
                            EmailTemplate.key == item.template_key
                        ))
                        template = t_query.scalar_one_or_none()
                        
                        if not template or not template.is_active:
                            logger.error(f"Template {item.template_key} not active/found.")
                            item.status = EmailStatus.FAILED
                            item.error_message = "Template not found or inactive"
                        else:
                            # Send via celery 
                            send_email_task.delay(item.recipient_email, template.subject, template.body)
                            item.status = EmailStatus.SENT
                            
                    except Exception as e:
                        logger.error(f"Failed to process email {queue_id}: {str(e)}")
                        item.retry_count += 1
                        # Exponential backoff: Base 2 (2, 4, 8, 16...) mins
                        backoff_mins = 2 ** item.retry_count
                        item.retry_backoff_until = datetime.now(timezone.utc) + timedelta(minutes=backoff_mins)
                        item.error_message = str(e)
                        
                        if item.retry_count > 5:
                            item.status = EmailStatus.FAILED
                        else:
                            item.status = EmailStatus.PENDING
                            
                    item.locked_by = None
                    item.locked_at = None
                    await db.commit()
                else:
                    # No work, sleep
                    await asyncio.sleep(2)
            except Exception as outer_e:
                logger.error(f"Worker Error: {str(outer_e)}")
                await asyncio.sleep(5)

async def main():
    worker_id = str(uuid.uuid4())
    logger.info(f"Starting Email Queue Worker {worker_id}")
    
    import sys
    if sys.platform != "win32":
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, handle_shutdown, sig, None)
    else:
        # Windows: use traditional signal handlers (SIGTERM may not be available)
        signal.signal(signal.SIGINT, handle_shutdown)
        
    worker_task = asyncio.create_task(process_queue(worker_id))
    
    await shutdown_event.wait()
    logger.info("Draining current batch...")
    # Add minor delay to let processing finish its current loop before killing
    await asyncio.sleep(1)
    worker_task.cancel()
    logger.info("Worker shutdown complete.")

if __name__ == "__main__":
    asyncio.run(main())
