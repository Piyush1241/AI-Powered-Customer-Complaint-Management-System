import React, { useState } from 'react';
import { Code2, ChevronRight, ChevronLeft, FileCode, Sparkles } from 'lucide-react';

const sections = [
  {
    id: 'opening',
    time: '0:00–0:20',
    title: 'Opening & Architecture Overview',
    subtitle: 'End-to-End Pipeline: Log, Edit, and Document Extraction',
    file: 'System Architecture',
    transcript: "This video walks through the code behind the Log Complaint flow, end to end — frontend trigger, API endpoint, LangGraph pipeline, and how the response updates the UI. The Edit and Extract tools reuse the same pipeline, so I'll point out where they diverge without re-walking the whole thing.",
    code: `// System Architecture Overview:
// 1. Frontend React (CopilotPanel.jsx) dispatches sendCopilotPrompt Redux thunk
// 2. FastAPI Backend (/api/copilot) receives payload + current form state
// 3. LangGraph Pipeline (StateGraph):
//    router -> extract -> merge -> completeness -> duplicate -> risk_capa
// 4. Groq LLM API (openai/gpt-oss-20b for Extraction, openai/gpt-oss-120b for Risk/CAPA)
// 5. PostgreSQL Audit Trail (Complaint + ComplaintHistory snapshot)
// 6. UI Updates via Redux state dispatch`
  },
  {
    id: 'frontend',
    time: '0:20–1:00',
    title: 'Frontend Trigger & State Payload',
    subtitle: 'CopilotPanel.jsx & Redux Thunk Dispatch',
    file: 'frontend/src/components/CopilotPanel.jsx',
    transcript: "Here's the copilot panel component. When I send a message, this thunk fires — it reads the current form and risk state from Redux, and posts it along with my message to the backend. This is important: every request carries the current complaint state, so the backend always knows what it's editing, not just what I typed.",
    code: `// frontend/src/components/CopilotPanel.jsx
export default function CopilotPanel() {
  const dispatch = useDispatch();
  const { currentForm } = useSelector((state) => state.complaint);

  const handleSendPrompt = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Dispatching Redux Async Thunk with full form context
    dispatch(sendCopilotPrompt({
      prompt,
      complaintId: null,
      currentForm // Passes current state so backend knows existing values for edits
    }));
    setPrompt('');
  };
  ...
}`
  },
  {
    id: 'api',
    time: '1:00–1:30',
    title: 'API Boundary & Controller',
    subtitle: 'FastAPI Endpoint: POST /api/copilot',
    file: 'backend/app/api/routes.py',
    transcript: "On the backend, this FastAPI endpoint receives that payload and invokes the LangGraph pipeline. The response schema mirrors what the frontend expects — updated form, updated risk assessment, and a short assistant reply.",
    code: `# backend/app/api/routes.py
@router.post("/copilot", response_model=CopilotResponse)
async def process_copilot_request(req: CopilotRequest, db: AsyncSession = Depends(get_db)):
    existing_form_dict = req.current_form.model_dump() if req.current_form else None

    initial_state = {
        "input_prompt": req.prompt or "",
        "action_type": None,
        "existing_form": existing_form_dict,
        "extracted_form": None,
        "current_form": None,
        "risk_assessment": None,
        "completeness_check": None,
        "duplicate_check": None
    }

    # Execute LangGraph Pipeline State Machine
    final_state = await complaint_graph.ainvoke(initial_state)

    return CopilotResponse(
        action_type=final_state.get("action_type", "LOG"),
        form_data=ComplaintFormData.model_validate(final_state.get("current_form") or {}),
        risk_assessment=RiskAssessment.model_validate(final_state.get("risk_assessment") or {}),
        completeness_check=CompletenessCheck.model_validate(final_state.get("completeness_check") or {}),
        duplicate_check=DuplicateCheck.model_validate(final_state.get("duplicate_check") or {})
    )`
  },
  {
    id: 'graph',
    time: '1:30–3:30',
    title: 'LangGraph Pipeline Structure',
    subtitle: 'State Graph, Router Node & Node Chains',
    file: 'backend/app/graph/workflow.py & nodes.py',
    transcript: "This is the actual state machine. Here's how it works: the router node looks at whether there's existing form data — if there is, this is treated as an edit; if not, it's a new log. That distinction matters a lot — I actually hit a real bug early on where corrections were being misclassified as brand-new complaints, which caused the AI to hallucinate unrelated data. Fixing that meant anchoring the router on specific fields like product name and batch number rather than just checking if the form object was non-empty. Next, the extraction node calls Groq with a prompt that's different depending on the mode — for edits, it's explicitly told 'this is a correction, only return fields that were mentioned, set everything else to null.' That was the second fix — without that instruction, the model would try to fill in a complete complaint even from a one-sentence correction. Then the merge node does a preserve-existing-fields update — it only overwrites fields where the extraction returned something new. Completeness and duplicate checks run next, then risk and CAPA assessment, which reasons over the full merged form, not just the latest message.",
    code: `# backend/app/graph/workflow.py
def build_complaint_workflow():
    workflow = StateGraph(GraphState)

    workflow.add_node("router", router_node)
    workflow.add_node("extract", extraction_node)
    workflow.add_node("merge", merger_node)
    workflow.add_node("completeness", completeness_node)
    workflow.add_node("duplicate", duplicate_node)
    workflow.add_node("risk_capa", risk_and_capa_node)

    workflow.set_entry_point("router")
    workflow.add_edge("router", "extract")
    workflow.add_edge("extract", "merge")
    workflow.add_edge("merge", "completeness")
    workflow.add_edge("completeness", "duplicate")
    workflow.add_edge("duplicate", "risk_capa")
    workflow.add_edge("risk_capa", END)

    return workflow.compile()`
  },
  {
    id: 'models',
    time: '3:30–4:30',
    title: 'LLM Selection & Groq Model Migration',
    subtitle: 'Upgraded to openai/gpt-oss-20b & gpt-oss-120b',
    file: 'backend/app/graph/nodes.py',
    transcript: "One thing worth flagging directly: the assignment specifies gemma2-9b-it and llama-3.3-70b-versatile. During development I found both had been deprecated by Groq — gemma2-9b-it in August 2025, and llama-3.3-70b-versatile more recently. I verified this against Groq's live API and their own deprecations documentation, and migrated to their officially recommended replacements — gpt-oss-20b and gpt-oss-120b. That's documented in my README with the source links, so it's traceable.",
    code: `# backend/app/graph/nodes.py
# 1. Fast Structured Data Extraction (20B Model)
extracted = await groq_client.call_groq_json(
    model="openai/gpt-oss-20b",
    system_prompt=system_prompt,
    user_prompt=prompt,
    schema_class=ComplaintFormData
)

# 2. Deep QMS Risk & CAPA Reasoning (120B Model)
risk = await groq_client.call_groq_json(
    model="openai/gpt-oss-120b",
    system_prompt=system_prompt,
    user_prompt=user_prompt,
    schema_class=RiskAssessment
)`
  },
  {
    id: 'json',
    time: '4:30–5:00',
    title: 'Structured JSON Reliability & Retries',
    subtitle: 'Pydantic Schema Validation & Retry Wrapper',
    file: 'backend/app/services/groq_client.py',
    transcript: "Since these models aren't guaranteed to return clean JSON on every call, I built a retry wrapper — if parsing fails, it re-prompts with a stricter instruction before giving up. That's this function here.",
    code: `# backend/app/services/groq_client.py
async def call_groq_json(self, model: str, system_prompt: str, user_prompt: str, schema_class: Type[T]) -> T:
    for attempt in range(self.max_retries):
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"}
            )
            raw_json = json.loads(response.choices[0].message.content)
            return schema_class.model_validate(raw_json)
        except (json.JSONDecodeError, ValidationError) as e:
            if attempt == self.max_retries - 1:
                raise e
            # Re-prompt with strict schema hint on retry
            messages.append({"role": "system", "content": f"JSON Invalid. Format strictly as {schema_class.__name__}"})`
  },
  {
    id: 'persistence',
    time: '5:00–6:00',
    title: 'Persistence & 21 CFR Part 11 Audit Trail',
    subtitle: 'PostgreSQL Database & Snapshot Models',
    file: 'backend/app/models/complaint.py',
    transcript: "Every log, edit, or extraction writes to Postgres — not just the final state, but a full history row with a snapshot of the form and risk assessment at that point in time. That's deliberate: real pharma QMS systems are audited on traceability, so I wanted every AI action to be reconstructable, not just the current state.",
    code: `# backend/app/models/complaint.py
class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_number = Column(String, unique=True, index=True)
    product_name = Column(String, nullable=False)
    batch_number = Column(String, nullable=False)
    status = Column(String, default="Logged")
    risk_assessment = Column(JSON)
    completeness_check = Column(JSON)

class ComplaintHistory(Base):
    __tablename__ = "complaint_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"))
    action_type = Column(String)  # LOGGED, EDITED, EXTRACTED
    form_snapshot = Column(JSON)
    risk_snapshot = Column(JSON)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)`
  },
  {
    id: 'ui-response',
    time: '6:00–6:30',
    title: 'UI State Update & React Re-render',
    subtitle: 'Redux Slice State Management',
    file: 'frontend/src/store/complaintSlice.js',
    transcript: "The response comes back to the frontend, Redux updates the form and risk state, and the components re-render from that state — the form never holds its own local state, so there's no way to accidentally type into it.",
    code: `// frontend/src/store/complaintSlice.js
extraReducers: (builder) => {
  builder
    .addCase(sendCopilotPrompt.fulfilled, (state, action) => {
      state.loading = false;
      const data = action.payload;
      // Imperative UI override prevented by strict Redux state binding
      state.currentForm = { ...state.currentForm, ...data.form_data };
      state.riskAssessment = data.risk_assessment;
      state.completenessCheck = data.completeness_check;
      state.duplicateCheck = data.duplicate_check;
    });
}`
  },
  {
    id: 'close',
    time: '6:30–7:00',
    title: 'Conclusion & Summary',
    subtitle: 'Unified Pipeline for Log, Edit & Extraction',
    file: 'Summary Overview',
    transcript: "That's the full loop for the Log tool. Edit and Document Extraction use this exact same graph — the only difference is where the input text comes from and how the router classifies the request. Thanks for watching.",
    code: `// Key Summary Points:
// 1. Single Unified Graph Workflow for Log, Edit, & PDF Extraction
// 2. Strict AI-Managed Read-Only Form (Zero Manual Typing)
// 3. Independent Severity (Patient Safety) vs Priority (Urgency) Assessment
// 4. Live Duplicate Detection against PostgreSQL Complaint History
// 5. Active 21 CFR Part 11 Immutable Snapshot Audit Logging`
  }
];

export default function CodeWalkthrough() {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = sections[activeIdx];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-6 h-full flex flex-col overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
            <Code2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">VIDEO 2 — Code Walkthrough</h2>
              <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Target ~8-9 min
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">End-to-End Pipeline & Architecture Script</p>
          </div>
        </div>

        {/* Section Step Tracker */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
            disabled={activeIdx === 0}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 border border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
            Step {activeIdx + 1} of {sections.length} ({current.time})
          </span>

          <button
            onClick={() => setActiveIdx((prev) => Math.min(sections.length - 1, prev + 1))}
            disabled={activeIdx === sections.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 border border-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timeline Quick Jump Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-800/80 scrollbar-none">
        {sections.map((sec, idx) => (
          <button
            key={sec.id}
            id={`step-pill-${idx}`}
            onClick={() => setActiveIdx(idx)}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
              activeIdx === idx
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50 scale-105'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            [{sec.time}] {sec.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Main Grid: Code View (Left 7 Cols) + Studio Teleprompter (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        {/* Left: Syntax Highlighted Code Viewer */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <FileCode className="h-4 w-4 text-blue-400" />
              <span className="font-bold text-white">{current.file}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {current.subtitle}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-200 bg-slate-950/90 leading-relaxed">
            <pre className="whitespace-pre-wrap font-mono text-blue-200/90">
              {current.code}
            </pre>
          </div>
        </div>

        {/* Right: Teleprompter & Transcript Script */}
        <div className="lg:col-span-5 flex flex-col bg-slate-800/80 rounded-xl border border-slate-800 p-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Spoken Script / Teleprompter</h3>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-sm leading-relaxed font-sans text-slate-100 shadow-inner min-h-[220px]">
              <p className="font-medium text-slate-100 italic">
                "{current.transcript}"
              </p>
            </div>
          </div>

          {/* Interactive Navigation Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">
              Section: <strong className="text-slate-200">{current.title}</strong>
            </span>

            <button
              id="next-section-btn"
              onClick={() => setActiveIdx((prev) => (prev + 1) % sections.length)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-md shadow-blue-900/50"
            >
              <span>Next Section</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
