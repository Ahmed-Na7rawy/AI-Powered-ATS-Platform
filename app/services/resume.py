import os
import uuid
import magic
from fastapi import UploadFile, HTTPException

RESUME_STORAGE_DIR = "storage/resumes"
os.makedirs(RESUME_STORAGE_DIR, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # docx
    "application/msword" # doc
}

async def save_resume_file(file: UploadFile, company_id: uuid.UUID) -> str:
    content = await file.read()
    
    # Reset cursor
    await file.seek(0)
    
    # File security: python-magic MIME check
    mime_type = magic.from_buffer(content, mime=True)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {mime_type}. Only PDF and DOC/DOCX allowed.")
        
    ext = ".pdf" if mime_type == "application/pdf" else ".docx"
    file_name = f"{company_id}_{uuid.uuid4()}{ext}"
    file_path = os.path.join(RESUME_STORAGE_DIR, file_name)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Return the relative path for database storage
    return os.path.join(RESUME_STORAGE_DIR, file_name).replace("\\", "/")
