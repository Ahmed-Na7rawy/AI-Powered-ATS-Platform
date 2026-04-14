import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import async_session
from app.models.company import Company
from app.models.hr_user import HRUser
from app.models.email import EmailTemplate
from app.api.routers.auth import get_password_hash

async def seed():
    async with async_session() as db:
        c = Company(name="Acme Corp Demo")
        db.add(c)
        await db.commit()
        await db.refresh(c)
        
        hr = HRUser(
            company_id=c.id,
            email="admin@acmedemo.com",
            password_hash=get_password_hash("secureQApass!"),
            is_admin=True
        )
        db.add(hr)
        
        templates = [
            {"key": "applied_thanks", "subject": "Application Received!", "body": "Thank you for applying to Acme corp. We'll be in touch!"},
            {"key": "followup", "subject": "Still interested?", "body": "Please let us know if you remain actively looking!"},
            {"key": "rejection", "subject": "Status Update", "body": "We won't be moving forward at this time."},
            {"key": "interview_invite", "subject": "Interview Request", "body": "We'd like to bring you in to discuss the role."}
        ]
        for t in templates:
            db.add(EmailTemplate(company_id=c.id, **t))
            
        await db.commit()
        print("======== SEED COMPLETE ========")
        print(f"Company Node: {c.name}")
        print("Login User: admin@acmedemo.com")
        print("Login Pass: secureQApass!")
        print("===============================")
        
if __name__ == "__main__":
    asyncio.run(seed())
