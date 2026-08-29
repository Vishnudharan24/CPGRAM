import os
import uuid
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.enums import ActorRole, GrievanceStatus, UserRole, WindowType
from app.deps import get_db, require_role
from app.models.atr import ATR, ATRAttachment
from app.models.grievance import Grievance
from app.models.grievance_event import GrievanceEvent
from app.schemas.grievance import ATRCreate, GrievanceDetail
from app.services.atr_quality_check import assess_atr
from app.services.sla_engine import close_window
from app.routers.grievances import _load_grievance

router = APIRouter(prefix="/grievances", tags=["officers"])


@router.post("/{grievance_id}/atr", response_model=GrievanceDetail)
def file_atr(
    grievance_id: uuid.UUID, 
    content: str = Form(...),
    mark_resolved: bool = Form(True),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db), 
    user=Depends(require_role(UserRole.gro, UserRole.npg, UserRole.admin))
):
    grievance = db.get(Grievance, grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    if user.role in (UserRole.npg, UserRole.gro) and grievance.organization_code != user.organization_code:
        raise HTTPException(status_code=403, detail="Not authorized to file ATR for this organization")
        
    quality = assess_atr(content)
    atr = ATR(grievance_id=grievance.id, officer_id=user.id, content=content, quality_flag=quality)
    db.add(atr)
    db.flush()

    for file in files:
        if not file.filename:
            continue
            
        allowed_exts = {".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".txt"}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_exts:
            raise HTTPException(status_code=400, detail=f"Invalid file extension: {ext}")
            
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = f"uploads/{unique_name}"
        
        with open(file_path, "wb") as f:
            f.write(file.file.read())
            
        file_size = os.path.getsize(file_path)
        if file_size > 5 * 1024 * 1024:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")

        attachment = ATRAttachment(
            atr_id=atr.id,
            file_name=file.filename,
            file_path=f"/uploads/{unique_name}",
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size
        )
        db.add(attachment)

    grievance.status = GrievanceStatus.resolved if mark_resolved else GrievanceStatus.atr_filed
    if mark_resolved:
        close_window(db, grievance.id, WindowType.resolution)
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="atr_filed", actor_role=ActorRole.gro, payload={"quality_flag": quality.value, "marked_resolved": mark_resolved}))
    db.commit()
    return _load_grievance(db, grievance.id)


