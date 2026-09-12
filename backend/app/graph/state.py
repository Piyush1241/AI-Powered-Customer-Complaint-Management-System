from typing import TypedDict, Optional, Dict, Any
from app.schemas.complaint import ComplaintFormData, RiskAssessment, CompletenessCheck, DuplicateCheck

class GraphState(TypedDict):
    input_prompt: str
    action_type: str # LOG, EDIT, EXTRACT
    complaint_id: Optional[str]
    existing_form: Optional[Dict[str, Any]]
    extracted_form: Optional[Dict[str, Any]]
    current_form: Optional[Dict[str, Any]]
    risk_assessment: Optional[Dict[str, Any]]
    completeness_check: Optional[Dict[str, Any]]
    duplicate_check: Optional[Dict[str, Any]]
    existing_complaints_summary: Optional[str]
