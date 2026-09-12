# AIVOA Pharma QMS — Customer Complaint Management System (API & FDF Edition)

An AI-driven Pharmaceutical Quality Management System (QMS) built to manage customer complaints for Active Pharmaceutical Ingredients (API) and Finished Dosage Forms (FDF) in compliance with **21 CFR Part 820** and **ICH Q10**.

---

## 🌟 Key Features

- **Strict AI-Managed Form**: Complaint entry fields are read-only and updated exclusively by the AI Copilot via prompt or document upload (no manual typing allowed per regulatory spec).
- **LangGraph State Machine Pipeline**:
  - `router_node`: Differentiates new complaint logs vs corrections/edits anchored on product and batch fields.
  - `extraction_node`: Extracts structured complaint data using `openai/gpt-oss-20b`.
  - `merger_node`: Preserves unmentioned fields on edits/corrections.
  - `completeness_node`: Evaluates regulatory QMS field completeness percentage based on API vs FDF schemas.
  - `duplicate_node`: Runs active PostgreSQL queries on batch and product prefixes to detect and flag duplicate complaints.
  - `risk_and_capa_node`: Evaluates independent **Severity** (patient safety/GMP impact) vs **Priority** (action urgency), root cause, and CAPA recommendations using `openai/gpt-oss-120b`.
- **Duplicate Prevention**: Rejects duplicate complaint saves via `HTTP 409 Conflict` and locks the UI save button when a duplicate batch is detected.
- **21 CFR Part 11 Audit Trail**: Logs every action (Log, Edit, Document Extract) into PostgreSQL with an immutable form and risk snapshot history.

---

## 🧠 Model Selection & Groq Deprecation Rationale

While the initial assignment specification referenced `gemma2-9b-it` and `llama-3.3-70b-versatile`, both models were deprecated on Groq Cloud:
- **`gemma2-9b-it`**: Deprecated by Groq in August 2025 ([Groq Model Deprecations Docs](https://console.groq.com/docs/deprecations)).
- **`llama-3.3-70b-versatile`**: Decommissioned on active Groq production endpoints.

To maintain production stability, reliability, and full compatibility with Groq's active API endpoints, the application was migrated to Groq's officially recommended replacement models:

1. **`openai/gpt-oss-20b` (Structured Data Extraction)**:
   - Utilized in `extraction_node` for rapid, deterministic extraction of structured complaint fields (`product_name`, `batch_number`, `quantity_affected`, `reporter_name`, etc.).
   - Optimized for fast latency and strict Pydantic JSON schema adherence.

2. **`openai/gpt-oss-120b` (QMS Risk & CAPA Reasoning)**:
   - Utilized in `risk_and_capa_node` for high-parameter reasoning over complex pharmaceutical QMS regulatory frameworks (21 CFR Part 820 & ICH Q10).
   - Performs independent **Severity** (patient safety / GMP impact) and **Priority** (action urgency / containment) evaluations, root cause hints, and structured CAPA recommendations.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: FastAPI, Python 3.9+, SQLAlchemy (Async), PostgreSQL, LangGraph, Groq LLM API.
- **Frontend**: React, Vite, Redux Toolkit, Tailwind CSS, Lucide Icons.
- **LLM Models**:
  - `openai/gpt-oss-20b` for fast, structured data extraction.
  - `openai/gpt-oss-120b` for deep QMS Risk & CAPA reasoning.

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set your GROQ_API_KEY and DATABASE_URL in .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Regression Tests

To run the automated multi-step session regression test suite:
```bash
cd backend
PYTHONPATH=. venv/bin/python test_regression.py
```
