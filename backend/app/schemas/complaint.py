from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ComplaintFormData(BaseModel):
    product_name: Optional[str] = None
    product_type: Optional[str] = None # API or FDF
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    batch_number: Optional[str] = None
    quantity_affected: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_type: Optional[str] = None
    reporter_contact: Optional[str] = None
    date_received: Optional[str] = None
    complaint_description: Optional[str] = None

class CAPARecommendation(BaseModel):
    immediate_correction: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    responsible_department: Optional[str] = None
    target_closure_days: Optional[int] = None

class RiskAssessment(BaseModel):
    severity: Optional[str] = "Minor" # Critical, Major, Minor
    priority: Optional[str] = "Medium" # Urgent, High, Medium, Low
    risk_score: Optional[int] = 1 # 1 to 10
    gmp_impact: Optional[str] = None
    root_cause_hint: Optional[str] = None
    recommended_next_action: Optional[str] = None
    complaint_summary: Optional[str] = None
    capa_recommendation: Optional[CAPARecommendation] = None

class CompletenessCheck(BaseModel):
    is_complete: bool = False
    missing_fields: List[str] = []
    completeness_score: int = 0 # Percentage 0-100

class DuplicateCheck(BaseModel):
    is_duplicate_suspected: bool = False
    matching_complaint_id: Optional[str] = None
    matching_reason: Optional[str] = None

class CopilotRequest(BaseModel):
    prompt: Optional[str] = None
    complaint_id: Optional[str] = None
    current_form: Optional[ComplaintFormData] = None

class CopilotResponse(BaseModel):
    action_type: str # LOG, EDIT, EXTRACT
    form_data: ComplaintFormData
    risk_assessment: RiskAssessment
    completeness_check: CompletenessCheck
    duplicate_check: DuplicateCheck

class ComplaintRead(BaseModel):
    id: str
    complaint_number: str
    product_name: Optional[str] = None
    product_type: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    batch_number: Optional[str] = None
    quantity_affected: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_type: Optional[str] = None
    reporter_contact: Optional[str] = None
    date_received: Optional[str] = None
    complaint_description: Optional[str] = None
    status: str
    risk_assessment: Optional[Dict[str, Any]] = None
    completeness_check: Optional[Dict[str, Any]] = None
    duplicate_info: Optional[Dict[str, Any]] = None
    capa_recommendation: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
