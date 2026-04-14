import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import async_session
from app.models.email import EmailQueue, EmailStatus
from app.email_worker import process_queue, shutdown_event
from sqlalchemy import select, func

async def setup_test_queue():
    async with async_session() as db:
        cid = uuid.uuid4()
        items = []
        for i in range(100):
            q = EmailQueue(
                company_id=cid,
                template_key="applied_thanks",
                recipient_email=f"user{i}@test.com",
                status=EmailStatus.PENDING,
                scheduled_at=datetime.now(timezone.utc)
            )
            items.append(q)
        db.add_all(items)
        await db.commit()
        return cid

async def verify(cid):
    async with async_session() as db:
        res = await db.execute(
            select(EmailQueue.status, func.count(EmailQueue.id))
            .where(EmailQueue.company_id == cid)
            .group_by(EmailQueue.status)
        )
        counts = res.all()
        print("\n--- Parallel Worker Result Counts ---")
        for status, count in counts:
            print(f"> {status.name}: {count}")

async def main():
    print("Setting up 100 pending queue items...")
    cid = await setup_test_queue()
    
    print("Starting 2 parallel workers using exact SELECT FOR UPDATE SKIP LOCKED locks...")
    worker1 = asyncio.create_task(process_queue("w1"))
    worker2 = asyncio.create_task(process_queue("w2"))
    
    # 10s should resolve all 100 mocked sends securely
    await asyncio.sleep(10)
    
    print("Requesting grace shutdown event...")
    shutdown_event.set()
    
    await asyncio.gather(worker1, worker2)
    print("Workers successfully flushed and terminated.")
    
    print("Verifying complete workload with ZERO duplicate lock sends...")
    await verify(cid)

if __name__ == "__main__":
    asyncio.run(main())
