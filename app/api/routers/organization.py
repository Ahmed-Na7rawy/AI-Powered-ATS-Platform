from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import uuid

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.hr_user import HRUser
from app.models.organization import Department, Job
from app.schemas.organization import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut,
    JobCreate, JobUpdate, JobOut
)

router = APIRouter()

# --- Departments ---

@router.get("/departments", response_model=list[DepartmentOut])
async def list_departments(
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Department).where(Department.company_id == current_user.company_id)
    )
    return result.scalars().all()

@router.post("/departments", response_model=DepartmentOut)
async def create_department(
    payload: DepartmentCreate,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    department = Department(
        company_id=current_user.company_id,
        name=payload.name
    )
    db.add(department)
    await db.commit()
    await db.refresh(department)
    return department

@router.put("/departments/{department_id}", response_model=DepartmentOut)
async def update_department(
    department_id: uuid.UUID,
    payload: DepartmentUpdate,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Department).where(
            Department.id == department_id,
            Department.company_id == current_user.company_id
        )
    )
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if payload.name is not None:
        department.name = payload.name
        
    await db.commit()
    await db.refresh(department)
    return department

@router.delete("/departments/{department_id}")
async def delete_department(
    department_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Department).where(
            Department.id == department_id,
            Department.company_id == current_user.company_id
        )
    )
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    await db.delete(department)
    await db.commit()
    return {"message": "Department deleted"}

# --- Jobs ---

@router.get("/jobs", response_model=list[JobOut])
async def list_jobs(
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job).where(Job.company_id == current_user.company_id)
    )
    return result.scalars().all()

@router.post("/jobs", response_model=JobOut)
async def create_job(
    payload: JobCreate,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify department belongs to company
    dept_check = await db.execute(
        select(Department).where(
            Department.id == payload.department_id,
            Department.company_id == current_user.company_id
        )
    )
    if not dept_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid department_id")

    job = Job(
        company_id=current_user.company_id,
        department_id=payload.department_id,
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job

@router.put("/jobs/{job_id}", response_model=JobOut)
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job).where(
            Job.id == job_id,
            Job.company_id == current_user.company_id
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if payload.department_id is not None:
        dept_check = await db.execute(
            select(Department).where(
                Department.id == payload.department_id,
                Department.company_id == current_user.company_id
            )
        )
        if not dept_check.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Invalid department_id")
        job.department_id = payload.department_id
        
    if payload.title is not None:
        job.title = payload.title
    if payload.description is not None:
        job.description = payload.description
    if payload.requirements is not None:
        job.requirements = payload.requirements
        
    await db.commit()
    await db.refresh(job)
    return job

@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: uuid.UUID,
    current_user: HRUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job).where(
            Job.id == job_id,
            Job.company_id == current_user.company_id
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    await db.delete(job)
    await db.commit()
    return {"message": "Job deleted"}
