import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendCopilotPrompt, uploadComplaintDoc } from '../store/complaintSlice';
import { Sparkles, Send, Upload, ShieldAlert, Cpu, CheckCircle2, Clock, Building2, Wrench } from 'lucide-react';

export default function CopilotPanel() {
  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState('');
  const { riskAssessment, completenessCheck, duplicateCheck, currentForm, loading } = useSelector((state) => state.complaint);

  const handleSendPrompt = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    dispatch(sendCopilotPrompt({
      prompt,
      complaintId: null,
      currentForm
    }));
    setPrompt('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadComplaintDoc(file));
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      {/* Copilot Header */}
      <div className="pb-4 mb-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-brand-600 rounded-lg border border-blue-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI Copilot & Risk Assessment</h2>
            <p className="text-xs text-gray-500">Groq LLM + LangGraph State Agent</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200 flex items-center gap-1">
          <Cpu className="h-3.5 w-3.5 text-brand-600" />
          openai/gpt-oss-20b / gpt-oss-120b
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        
        {/* Natural Language Prompt & File Input Form */}
        <form onSubmit={handleSendPrompt} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Copilot Input (Log / Edit Prompt or Query)
            </label>
            <div className="relative">
              <textarea
                rows="3"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Log a complaint: 'Dr Sarah Jenkins from St Jude Hospital reported 2500 capsules of Amoxicillin 500mg batch AMX-2024-09A discolored...'"
                className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50/50"
              ></textarea>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="absolute bottom-3 right-3 p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Document Upload */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5 text-brand-600" />
              <span>Upload PDF / Email</span>
              <input type="file" accept=".pdf,.txt,.eml" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </form>

        {/* Loading / Staged Extraction Progress Bar Indicator */}
        {loading && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-brand-600 animate-spin" />
                AI EXTRACTION &amp; ASSESSMENT IN PROGRESS
              </span>
              <span className="text-brand-700">Executing Nodes...</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 animate-pulse rounded-full w-3/4"></div>
            </div>
            <p className="text-[11px] text-slate-500">
              Analyzing text -&gt; Extracting QMS fields -&gt; Evaluating Completeness -&gt; Running Risk &amp; CAPA model
            </p>
          </div>
        )}

        {/* Risk & CAPA Output Card */}
        {riskAssessment && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            
            {/* Severity & Priority Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">AI Risk &amp; Action Classification</span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Severity Badge */}
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                    riskAssessment.severity === 'Critical'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : riskAssessment.severity === 'Major'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {riskAssessment.severity || 'Minor'} Severity
                  </span>

                  {/* Priority Badge */}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                    riskAssessment.priority === 'Urgent'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : riskAssessment.priority === 'High'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : riskAssessment.priority === 'Medium'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {riskAssessment.priority || 'Medium'} Priority
                  </span>

                  <span className="text-xs font-semibold text-gray-600">Score: {riskAssessment.risk_score || 7}/10</span>
                </div>
              </div>

              <ShieldAlert className={`h-6 w-6 ${
                riskAssessment.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'
              }`} />
            </div>

            {/* Executive Summary */}
            {riskAssessment.complaint_summary && (
              <div className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-slate-200">
                <strong className="text-gray-900">Complaint Summary:</strong> {riskAssessment.complaint_summary}
              </div>
            )}

            {/* GMP Impact & Root Cause */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              {riskAssessment.gmp_impact && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-800">GMP Impact:</strong> {riskAssessment.gmp_impact}
                </div>
              )}
              {riskAssessment.root_cause_hint && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-800">Root Cause Analysis:</strong> {riskAssessment.root_cause_hint}
                </div>
              )}
            </div>

            {/* CAPA Recommendation Section (ICH Q10 / 21 CFR Part 820) */}
            {riskAssessment.capa_recommendation && (
              <div className="bg-white border border-brand-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-brand-100 pb-1.5">
                  <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-brand-600" />
                    Recommended CAPA Action Plan
                  </span>
                  <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Target Closure: {riskAssessment.capa_recommendation.target_closure_days || 14} Days
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-700">
                  <p>
                    <strong className="text-gray-900">Immediate Correction:</strong> {riskAssessment.capa_recommendation.immediate_correction}
                  </p>
                  <p>
                    <strong className="text-gray-900">Corrective Action:</strong> {riskAssessment.capa_recommendation.corrective_action}
                  </p>
                  <p>
                    <strong className="text-gray-900">Preventive Action:</strong> {riskAssessment.capa_recommendation.preventive_action}
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[11px] text-gray-500">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span>Owner: <strong>{riskAssessment.capa_recommendation.responsible_department || 'QA / Operations'}</strong></span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
