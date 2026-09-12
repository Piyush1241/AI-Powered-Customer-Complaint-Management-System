from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import uuid
import datetime

from app.core.database import get_db
from app.models.complaint import Complaint, ComplaintHistory
from app.schemas.complaint import (
    CopilotRequest,
    CopilotResponse,
    ComplaintFormData,
    RiskAssessment,
    CompletenessCheck,
    DuplicateCheck,
    ComplaintRead
)
from app.graph.workflow import complaint_graph
from app.services.pdf_service import extract_text_from_file

router = APIRouter()

@router.post("/copilot", response_model=CopilotResponse)
async def process_copilot_request(req: CopilotRequest, db: AsyncSession = Depends(get_db)):
    """
    Triggers the LangGraph pipeline for Log Complaint and Edit Complaint natural language prompts.
    """
    existing_form_dict = req.current_form.model_dump() if req.current_form else None

    initial_state = {
        "input_prompt": req.prompt or "",
        "action_type": None,
        "complaint_id": req.complaint_id,
        "existing_form": existing_form_dict,
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None,
        "existing_complaints_summary": None
    }

    final_state = await complaint_graph.ainvoke(initial_state)

    form_data = ComplaintFormData.model_validate(final_state.get("current_form") or {})
    risk_assessment = RiskAssessment.model_validate(final_state.get("risk_assessment") or {})
    completeness_check = CompletenessCheck.model_validate(final_state.get("completeness_check") or {})
    duplicate_check = DuplicateCheck.model_validate(final_state.get("duplicate_check") or {})

    return CopilotResponse(
        action_type=final_state.get("action_type", "LOG"),
        form_data=form_data,
        risk_assessment=risk_assessment,
        completeness_check=completeness_check,
        duplicate_check=duplicate_check
    )


@router.post("/upload", response_model=CopilotResponse)
async def upload_document_extraction(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Parses PDF/Email document text and triggers Document Extraction LangGraph tool.
    """
    file_content = await file.read()
    extracted_text = await extract_text_from_file(file_content, file.filename)

    initial_state = {
        "input_prompt": f"Document text extracted from {file.filename}:\n\n{extracted_text}",
        "action_type": "EXTRACT",
        "complaint_id": None,
        "existing_form": None,
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None,
        "existing_complaints_summary": None
    }

    final_state = await complaint_graph.ainvoke(initial_state)

    form_data = ComplaintFormData.model_validate(final_state.get("current_form") or {})
    risk_assessment = RiskAssessment.model_validate(final_state.get("risk_assessment") or {})
    completeness_check = CompletenessCheck.model_validate(final_state.get("completeness_check") or {})
    duplicate_check = DuplicateCheck.model_validate(final_state.get("duplicate_check") or {})

    return CopilotResponse(
        action_type="EXTRACT",
        form_data=form_data,
        risk_assessment=risk_assessment,
        completeness_check=completeness_check,
        duplicate_check=duplicate_check
    )


@router.post("/complaints", response_model=ComplaintRead)
async def save_complaint(
    form_data: ComplaintFormData,
    risk_assessment: RiskAssessment,
    completeness_check: CompletenessCheck,
    db: AsyncSession = Depends(get_db)
):
    """
    Saves or updates a complaint record in PostgreSQL with 21 CFR Part 11 compliant audit history.
    Prevents duplicate complaint registration for active batches.
    """
    if form_data.batch_number and str(form_data.batch_number).strip() != "" and str(form_data.batch_number).strip().lower() != "null":
        clean_batch = str(form_data.batch_number).strip()
        stmt = select(Complaint).where(Complaint.batch_number.ilike(clean_batch))
        result = await db.execute(stmt)
        existing = result.scalars().first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Duplicate Complaint Blocked: Active complaint #{existing.complaint_number} already exists for batch {existing.batch_number} ({existing.product_name})."
            )

    complaint_num = f"CMP-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    
    new_complaint = Complaint(
        complaint_number=complaint_num,
        product_name=form_data.product_name,
        product_type=form_data.product_type,
        dosage_form=form_data.dosage_form,
        strength=form_data.strength,
        batch_number=form_data.batch_number,
        quantity_affected=form_data.quantity_affected,
        reporter_name=form_data.reporter_name,
        reporter_type=form_data.reporter_type,
        reporter_contact=form_data.reporter_contact,
        date_received=form_data.date_received or datetime.date.today().isoformat(),
        complaint_description=form_data.complaint_description,
        status="Logged",
        risk_assessment=risk_assessment.model_dump(),
        completeness_check=completeness_check.model_dump(),
        capa_recommendation=risk_assessment.capa_recommendation.model_dump() if risk_assessment.capa_recommendation else None
    )

    db.add(new_complaint)
    await db.flush()

    history_entry = ComplaintHistory(
        complaint_id=new_complaint.id,
        action_type="LOGGED",
        form_snapshot=form_data.model_dump(),
        risk_snapshot=risk_assessment.model_dump()
    )
    db.add(history_entry)

    await db.commit()
    await db.refresh(new_complaint)
    return new_complaint


@router.get("/complaints", response_model=List[ComplaintRead])
async def list_complaints(db: AsyncSession = Depends(get_db)):
    """
    Retrieves list of all logged complaints for the QMS dashboard.
    """
    result = await db.execute(select(Complaint).order_by(Complaint.created_at.desc()))
    complaints = result.scalars().all()
    return complaints


@router.delete("/complaints")
async def clear_all_complaints(db: AsyncSession = Depends(get_db)):
    """
    Clears all complaint records and audit history from PostgreSQL.
    """
    from sqlalchemy import delete
    await db.execute(delete(ComplaintHistory))
    await db.execute(delete(Complaint))
    await db.commit()
    return {"message": "All complaints cleared successfully"}

