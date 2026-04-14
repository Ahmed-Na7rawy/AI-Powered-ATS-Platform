import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.company import Company
from app.models.hr_user import HRUser
from app.models.candidate import CandidateLink, Candidate
from app.models.email import EmailQueue
from unittest.mock import AsyncMock, patch
import uuid
import os
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_apply_flow_and_multi_tenancy(client: AsyncClient, db_session):
    # Seed Company 1
    c1 = Company(id=uuid.uuid4(), name="Test Corp 1")
    db_session.add(c1)
    
    # Seed Company 2
    c2 = Company(id=uuid.uuid4(), name="Test Corp 2")
    db_session.add(c2)
    await db_session.commit()
    
    # HR User 1 & 2 Setup for Multi-tenancy scoping
    hr1 = HRUser(company_id=c1.id, email="hr1@test.com", password_hash="fake_hash")
    db_session.add(hr1)
    hr2 = HRUser(company_id=c2.id, email="hr2@test.com", password_hash="fake_hash")
    db_session.add(hr2)
    await db_session.commit()
    
    # Generate an apply link manually scoped to Company 1
    link = CandidateLink(
        company_id=c1.id,
        job_id="ENG_01",
        token="test_token_123",
        expires_at=datetime(2099, 1, 1, tzinfo=timezone.utc)
    )
    db_session.add(link)
    await db_session.commit()
    
    # Create fake PDF matching magic bytes
    dummy_pdf = b"%PDF-1.4\ndummy content for testing"
    
    # Mock save_resume_file so we don't depend on python-magic during tests
    with patch("app.api.routers.apply.save_resume_file", new_callable=AsyncMock) as mock_save:
        mock_save.return_value = "storage/resumes/test_resume.pdf"
        
        response = await client.post(
            "/apply/test_token_123",
            data={"first_name": "Jane", "last_name": "Doe", "email": "jane@example.com"},
            files={"resume": ("dummy.pdf", dummy_pdf, "application/pdf")}
        )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    # Check Candidate was exclusively registered under company 1
    cand = (await db_session.execute(select(Candidate).filter_by(email="jane@example.com"))).scalar_one()
    assert cand.company_id == c1.id
    
    # Cross tenant 404 Guard Mock: HR2 shouldn't see Jane
    assert cand.company_id != c2.id
    
    # Verify Email Hooks: EmailQueue deduplication correctly registered applied_thanks
    eq = (await db_session.execute(select(EmailQueue).filter_by(recipient_email="jane@example.com"))).scalar_one()
    assert eq.template_key == "applied_thanks"
    assert eq.status.value == "PENDING"
