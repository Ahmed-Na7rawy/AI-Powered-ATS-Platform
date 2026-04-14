from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.config import settings
from app.database import get_db
from app.models.hr_user import HRUser
from app.models.company import Company
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    query_token: str = Query(None, alias="token"),
    db: AsyncSession = Depends(get_db)
) -> HRUser:
    actual_token = token or query_token
    
    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("user_id")
        company_id: str = payload.get("company_id")
        if user_id is None or company_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        token_data = TokenPayload(user_id=user_id, company_id=company_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    result = await db.execute(select(HRUser).where(HRUser.id == uuid.UUID(token_data.user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

from app.services.ai_base import AIService
from app.services.ai_gemini import GeminiService

async def get_ai_service(
    db: AsyncSession = Depends(get_db),
    current_user: HRUser = Depends(get_current_user)
) -> AIService:
    # Check if this specific company has their own API key
    res = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = res.scalar_one_or_none()
    
    # Priority: Company Key > Environment Default
    key = (company.gemini_api_key if company else None) or settings.GEMINI_API_KEY
    return GeminiService(api_key=key)
