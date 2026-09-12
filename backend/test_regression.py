import asyncio
import os
import sys
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)


from app.graph.workflow import complaint_graph

async def test_session_regression():
    print("Executing Multi-Step Session Regression Test Suite...")
    
    # -------------------------------------------------------------
    # TEST CASE 1: Log complaint -> send edit correction -> verify preservation
    # -------------------------------------------------------------
    print("\n--- TEST CASE 1: Log & Edit Field Correction ---")
    log_prompt = "Customer reported Amoxicillin 500mg capsules discolored brownish in batch AMX-2024-09A. Received 2500 capsules from Dr Sarah Jenkins at St Jude Hospital."
    
    s1 = await complaint_graph.ainvoke({
        "input_prompt": log_prompt,
        "action_type": None,
        "complaint_id": None,
        "existing_form": None,
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None,
        "existing_complaints_summary": None
    })
    form1 = s1.get("current_form")
    print("Log Initial Form:", form1.get("product_name"), form1.get("batch_number"), form1.get("quantity_affected"))
    
    edit_prompt = "sorry batch no is AMX-2026-09B and quantity is 5000 capsules"
    s2 = await complaint_graph.ainvoke({
        "input_prompt": edit_prompt,
        "action_type": None,
        "complaint_id": None,
        "existing_form": form1,
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None,
        "existing_complaints_summary": None
    })
    form2 = s2.get("current_form")
    print("Action Type:", s2.get("action_type"))
    print("Edited Form:", form2.get("product_name"), form2.get("batch_number"), form2.get("quantity_affected"))
    
    assert form2.get("product_name") == form1.get("product_name"), "FAIL: Product Name got overwritten!"
    assert form2.get("batch_number") == "AMX-2026-09B", "FAIL: Batch Number was not updated!"
    assert form2.get("quantity_affected") == "5000 capsules", "FAIL: Quantity was not updated!"
    print("--> TEST CASE 1 PASSED!")

    # -------------------------------------------------------------
    # TEST CASE 2: Upload document -> send plain text edit correction -> verify zero document bleed
    # -------------------------------------------------------------
    print("\n--- TEST CASE 2: Upload Doc -> Plain Text Correction (No Doc Bleed) ---")
    doc_prompt = "Document text extracted from sample_metformin_complaint.txt:\n\nMetformin ER 1000mg batch MET-8842-X failed dissolution test at 8 hrs (result 64%). Quantity: 10000 tablets. Reporter: Apex QA Labs."
    s3 = await complaint_graph.ainvoke({
        "input_prompt": doc_prompt,
        "action_type": "EXTRACT",
        "complaint_id": None,
        "existing_form": None,
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None,
        "existing_complaints_summary": None
    })
    form3 = s3.get("current_form")
    print("Doc Initial Form:", form3.get("product_name"), form3.get("batch_number"), form3.get("quantity_affected"))
    
    # User sends a follow-up plain text correction
    plain_text_prompt = "sorry the strength is 500mg"
    s4 = await complaint_graph.ainvoke({
        "input_prompt": plain_text_prompt,
        "action_type": None,
        "complaint_id": None,
        "existing_form": form3, # Pass active Metformin form
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None,
        "existing_complaints_summary": None
    })
    form4 = s4.get("current_form")
    print("Action Type:", s4.get("action_type"))
    print("Correction Form:", form4.get("product_name"), form4.get("batch_number"), form4.get("strength"))
    
    assert form4.get("product_name") == form3.get("product_name"), "FAIL: Product Name changed on plain text edit!"
    assert form4.get("batch_number") == form3.get("batch_number"), "FAIL: Batch Number changed on plain text edit!"
    assert "500" in str(form4.get("strength")), "FAIL: Strength was not updated!"
    print("--> TEST CASE 2 PASSED!")

    print("\n==========================================")
    print("ALL REGRESSION TEST CASES PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(test_session_regression())
