import logging
from app.graph.state import GraphState
from app.schemas.complaint import ComplaintFormData, RiskAssessment, CompletenessCheck, DuplicateCheck
from app.services.groq_client import groq_client
from app.core.database import AsyncSessionLocal
from app.models.complaint import Complaint
from sqlalchemy.future import select

logger = logging.getLogger(__name__)

async def router_node(state: GraphState) -> GraphState:
    if state.get("action_type") == "EXTRACT":
        return state
        
    existing = state.get("existing_form") or {}
    
    has_anchor_field = bool(existing.get("product_name") or existing.get("batch_number"))
    has_non_empty_values = any(
        val is not None and str(val).strip() != "" and str(val).strip().lower() != "null"
        for val in existing.values()
    )
    
    if state.get("complaint_id") or has_anchor_field or has_non_empty_values:
        state["action_type"] = "EDIT"
    else:
        state["action_type"] = "LOG"
        
    return state


async def extraction_node(state: GraphState) -> GraphState:
    prompt = state["input_prompt"]
    action_type = state.get("action_type", "LOG")
    existing_form = state.get("existing_form") or {}
    
    if action_type == "EDIT":
        system_prompt = f"""You are an expert Pharmaceutical Quality Management System (QMS) Data Editor.
This is a CORRECTION / EDIT to an existing complaint.
Current complaint form state:
{existing_form}

Analyze the user's edit message and return ONLY the fields explicitly mentioned or updated in the message.
Set every other unmentioned field to null. DO NOT invent, guess, or hallucinate values for any unmentioned fields.

Fields schema:
product_name, product_type, dosage_form, strength, batch_number, quantity_affected, reporter_name, reporter_type, reporter_contact, date_received, complaint_description."""
    else:
        system_prompt = """You are an expert Pharmaceutical Quality Management System (QMS) Data Extractor.
Extract structured information from the provided customer complaint text or document.
Fields to extract:
- product_name (e.g. Amoxicillin 500mg, Metformin ER, Paracetamol API)
- product_type ("API" for Active Pharmaceutical Ingredient or "FDF" for Finished Dosage Form)
- dosage_form (For FDF: Capsule, Tablet, Injection, etc. For API: Set to "N/A (API Raw Material)" unless a specific form like Powder is given)
- strength (500mg, 1000mg, 99.5%, etc.)
- batch_number (e.g. AMX-2024-09A, MET-8842-X, PARA-2024-01R)
- quantity_affected (e.g. 500 bottles, 10000 tablets, 300 kg)
- reporter_name
- reporter_type (Hospital Pharmacist, Distributor, Physician, Patient, Manufacturer, QA Laboratory)
- reporter_contact (email/phone)
- date_received (YYYY-MM-DD format if present)
- complaint_description (clear, concise description of the reported defect or issue)

If a field is missing or not mentioned, set its value to null."""

    extracted = await groq_client.call_groq_json(
        model="openai/gpt-oss-20b",
        system_prompt=system_prompt,
        user_prompt=prompt,
        schema_class=ComplaintFormData
    )
    
    state["extracted_form"] = extracted.model_dump()
    return state


async def merger_node(state: GraphState) -> GraphState:
    action = state.get("action_type")
    extracted = state.get("extracted_form", {})
    existing = state.get("existing_form") or {}

    if action == "EDIT" and existing:
        merged = dict(existing)
        for key, val in extracted.items():
            if val is not None and str(val).strip() != "" and str(val).strip().lower() != "null":
                merged[key] = val
        state["current_form"] = merged
    else:
        state["current_form"] = extracted

    form = state.get("current_form", {})
    if form.get("product_type") == "API" and (not form.get("dosage_form") or form.get("dosage_form") == "null"):
        form["dosage_form"] = "N/A (API Raw Material)"

    return state


async def completeness_node(state: GraphState) -> GraphState:
    form = state.get("current_form", {})
    p_type = form.get("product_type", "FDF")

    if p_type == "API":
        mandatory_fields = ["product_name", "batch_number", "quantity_affected", "reporter_name", "complaint_description"]
    else:
        mandatory_fields = ["product_name", "dosage_form", "batch_number", "quantity_affected", "reporter_name", "complaint_description"]
    
    missing = []
    filled_count = 0
    total_count = len(mandatory_fields)

    for field in mandatory_fields:
        val = form.get(field)
        if not val or str(val).strip() == "" or str(val).strip().lower() == "null":
            missing.append(field)
        else:
            filled_count += 1

    score = int((filled_count / total_count) * 100)
    state["completeness_check"] = {
        "is_complete": len(missing) == 0,
        "missing_fields": missing,
        "completeness_score": score
    }
    return state


async def duplicate_node(state: GraphState) -> GraphState:
    form = state.get("current_form", {})
    batch = form.get("batch_number")
    product = form.get("product_name")

    if not batch and not product:
        state["duplicate_check"] = {
            "is_duplicate_suspected": False,
            "matching_complaint_id": None,
            "matching_reason": None
        }
        return state

    try:
        async with AsyncSessionLocal() as session:
            if batch and str(batch).strip() != "" and str(batch).strip().lower() != "null":
                clean_batch = str(batch).strip()
                # Exact batch match
                stmt = select(Complaint).where(Complaint.batch_number.ilike(clean_batch))
                result = await session.execute(stmt)
                match = result.scalars().first()
                if match:
                    state["duplicate_check"] = {
                        "is_duplicate_suspected": True,
                        "matching_complaint_id": match.complaint_number,
                        "matching_reason": f"Active complaint #{match.complaint_number} already exists for batch {match.batch_number} ({match.product_name})."
                    }
                    return state

                # Substring batch match
                stmt_partial = select(Complaint).where(Complaint.batch_number.ilike(f"%{clean_batch}%"))
                result_partial = await session.execute(stmt_partial)
                match_p = result_partial.scalars().first()
                if match_p:
                    state["duplicate_check"] = {
                        "is_duplicate_suspected": True,
                        "matching_complaint_id": match_p.complaint_number,
                        "matching_reason": f"Active complaint #{match_p.complaint_number} already exists for batch {match_p.batch_number} ({match_p.product_name})."
                    }
                    return state

            if product and str(product).strip() != "" and str(product).strip().lower() != "null":
                clean_prod = str(product).strip()
                first_word = clean_prod.split()[0] if clean_prod.split() else clean_prod
                
                # Search by full product name or primary product name (first word, e.g. Amoxicillin, Paracetamol)
                stmt = select(Complaint).where(
                    (Complaint.product_name.ilike(f"%{clean_prod}%")) |
                    (Complaint.product_name.ilike(f"%{first_word}%"))
                )
                result = await session.execute(stmt)
                matches = result.scalars().all()
                if len(matches) >= 1:
                    first_match = matches[0]
                    state["duplicate_check"] = {
                        "is_duplicate_suspected": True,
                        "matching_complaint_id": first_match.complaint_number,
                        "matching_reason": f"Existing complaint #{first_match.complaint_number} found for product {first_match.product_name}."
                    }
                    return state
    except Exception as e:
        logger.warning(f"Duplicate check query exception: {e}")

    state["duplicate_check"] = {
        "is_duplicate_suspected": False,
        "matching_complaint_id": None,
        "matching_reason": None
    }
    return state


async def risk_and_capa_node(state: GraphState) -> GraphState:
    form = state.get("current_form", {})
    
    system_prompt = """You are a Lead Quality Assurance Expert in Pharmaceutical QMS (21 CFR Part 820 & ICH Q10).
Analyze the customer complaint form data provided and generate a comprehensive Risk & CAPA Assessment.

Assess SEVERITY and PRIORITY as SEPARATE, independent judgments:
- SEVERITY = how serious the defect itself is regarding patient safety and GMP impact (Minor, Major, Critical).
- PRIORITY = how urgently this needs action right now considering active distribution or containment (Low, Medium, High, Urgent).

You must determine:
1. severity: "Critical", "Major", or "Minor".
2. priority: "Urgent", "High", "Medium", or "Low".
3. risk_score: Integer 1-10.
4. gmp_impact: Impact on Good Manufacturing Practice (e.g. batch recall potential, stability trend).
5. root_cause_hint: Likely root cause in API/FDF manufacturing, packaging, or storage.
6. recommended_next_action: Immediate QMS action.
7. complaint_summary: 1-2 sentence executive summary.
8. capa_recommendation: Structured CAPA object with immediate_correction, corrective_action, preventive_action, responsible_department, and target_closure_days."""

    user_prompt = f"""Complaint Form Data:
{form}"""

    risk = await groq_client.call_groq_json(
        model="openai/gpt-oss-120b",
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_class=RiskAssessment
    )

    state["risk_assessment"] = risk.model_dump()
    return state
