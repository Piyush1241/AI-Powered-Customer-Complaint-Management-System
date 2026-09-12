import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetForm, saveComplaintToDb } from '../store/complaintSlice';
import { Save, RotateCcw, AlertTriangle, CheckCircle, Package, Lock, AlertOctagon } from 'lucide-react';

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const { currentForm, riskAssessment, completenessCheck, duplicateCheck, loading } = useSelector((state) => state.complaint);

  const handleSave = () => {
    dispatch(saveComplaintToDb({
      formData: currentForm,
      riskAssessment: riskAssessment || {},
      completenessCheck: completenessCheck || { is_complete: false, missing_fields: [], completeness_score: 0 }
    }));
  };

  const severityClass = (val) => {
    if (val === 'Critical') return 'bg-red-50 text-red-800 border-red-300 font-bold';
    if (val === 'Major') return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    if (val === 'Minor') return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  const priorityClass = (val) => {
    if (val === 'Urgent') return 'bg-red-50 text-red-800 border-red-300 font-bold';
    if (val === 'High') return 'bg-orange-50 text-orange-800 border-orange-300 font-semibold';
    if (val === 'Medium') return 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
    if (val === 'Low') return 'bg-slate-50 text-slate-700 border-slate-200 font-medium';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-600" />
            Log Customer Complaint
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-500" />
              AI Managed (Read-Only)
            </span>
          </h2>
          <p className="text-xs text-gray-500">Auto-filled exclusively by AI Copilot (Manual typing locked per spec)</p>
        </div>

        <div className="flex items-center gap-2">
          {duplicateCheck && duplicateCheck.is_duplicate_suspected && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
              <AlertOctagon className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              Duplicate Flagged
            </span>
          )}
          {completenessCheck && (
            <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ' + (
              completenessCheck.is_complete
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            )}>
              {completenessCheck.is_complete ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              Completeness: {completenessCheck.completeness_score}%
            </span>
          )}
        </div>
      </div>

      {/* Sectioned Form Fields */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        
        {/* Section 1: Product & Batch Identification */}
        <fieldset className="border border-gray-200 rounded-lg p-3 bg-slate-50/50">
          <legend className="text-xs font-bold text-slate-700 px-2 bg-white rounded border border-gray-200">
            1. Product &amp; Batch Identification
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                readOnly
                value={currentForm.product_name || ''}
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Type</label>
              <select
                disabled
                value={currentForm.product_type || 'FDF'}
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              >
                <option value="FDF">FDF (Finished Dosage Form)</option>
                <option value="API">API (Active Pharmaceutical Ingredient)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dosage Form</label>
              <input
                type="text"
                readOnly
                value={
                  currentForm.dosage_form || 
                  (currentForm.product_type === 'API' ? 'N/A (API Raw Material)' : '')
                }
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Strength / Concentration</label>
              <input
                type="text"
                readOnly
                value={currentForm.strength || ''}
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Batch / Lot Number *</label>
              <input
                type="text"
                readOnly
                value={currentForm.batch_number || ''}
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 font-mono font-semibold cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Affected *</label>
              <input
                type="text"
                readOnly
                value={currentForm.quantity_affected || ''}
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Section 2: Reporter & Intake Origin */}
        <fieldset className="border border-gray-200 rounded-lg p-3 bg-slate-50/50">
          <legend className="text-xs font-bold text-slate-700 px-2 bg-white rounded border border-gray-200">
            2. Reporter &amp; Intake Origin
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reporter Name *</label>
              <input
                type="text"
                readOnly
                value={currentForm.reporter_name || ''}
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reporter Type</label>
              <input
                type="text"
                readOnly
                value={
                  currentForm.reporter_type || 
                  (currentForm.reporter_name ? 'Customer QA / Facility' : '')
                }
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reporter Contact</label>
              <input
                type="text"
                readOnly
                value={currentForm.reporter_contact || ''}
                placeholder="Awaiting AI extraction..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Section 3: Defect & Quality Issue Details */}
        <fieldset className="border border-gray-200 rounded-lg p-3 bg-slate-50/50">
          <legend className="text-xs font-bold text-slate-700 px-2 bg-white rounded border border-gray-200">
            3. Defect &amp; Quality Issue Details
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date Received</label>
              <input
                type="text"
                readOnly
                value={currentForm.date_received || ''}
                placeholder="YYYY-MM-DD"
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Complaint Description *</label>
              <textarea
                rows="2"
                readOnly
                value={currentForm.complaint_description || ''}
                placeholder="Awaiting AI extraction from prompt or document upload..."
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-slate-100/70 text-slate-800 cursor-not-allowed focus:outline-none"
              ></textarea>
            </div>
          </div>
        </fieldset>

        {/* Section 4: Initial Risk Severity & Priority Assessment */}
        <fieldset className="border border-gray-200 rounded-lg p-3 bg-slate-50/50">
          <legend className="text-xs font-bold text-slate-700 px-2 bg-white rounded border border-gray-200">
            4. Initial Assessment &amp; Priority
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Severity</label>
              <select
                disabled
                value={riskAssessment?.severity || ''}
                className={'w-full text-sm px-3 py-1.5 border rounded-md cursor-not-allowed focus:outline-none ' + severityClass(riskAssessment?.severity)}
              >
                <option value="">Awaiting AI extraction...</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Action Priority</label>
              <select
                disabled
                value={riskAssessment?.priority || ''}
                className={'w-full text-sm px-3 py-1.5 border rounded-md cursor-not-allowed focus:outline-none ' + priorityClass(riskAssessment?.priority)}
              >
                <option value="">Awaiting AI extraction...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </fieldset>

      </div>

      {/* Duplicate Complaint Warning Banner */}
      {duplicateCheck && duplicateCheck.is_duplicate_suspected && (
        <div className="mt-3 p-3.5 bg-amber-50 border-2 border-amber-400 rounded-lg text-xs text-amber-950 flex items-start gap-2.5 shadow-sm">
          <AlertOctagon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold text-amber-950 text-sm block mb-0.5">Potential Duplicate Complaint Flagged!</strong>
            <p className="text-amber-900 text-xs font-semibold">{duplicateCheck.matching_reason}</p>
            <p className="text-[11px] text-amber-800 mt-1 italic">
              An active complaint record for this batch/product already exists in the QMS registry. Review the existing record before filing a duplicate.
            </p>
          </div>
        </div>
      )}

      {/* Missing Fields Warning Banner */}
      {completenessCheck && !completenessCheck.is_complete && completenessCheck.missing_fields.length > 0 && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Missing Regulatory QMS Fields:</strong> {completenessCheck.missing_fields.join(', ')}
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
        <button
          type="button"
          onClick={() => dispatch(resetForm())}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Form
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !currentForm.product_name || (duplicateCheck && duplicateCheck.is_duplicate_suspected)}
          className={"flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-md shadow-sm disabled:opacity-50 transition-colors " + (
            duplicateCheck && duplicateCheck.is_duplicate_suspected
              ? "bg-amber-600 hover:bg-amber-700 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700"
          )}
          title={duplicateCheck?.is_duplicate_suspected ? "Duplicate complaint detected in registry" : "Save complaint"}
        >
          <Save className="h-4 w-4" />
          {duplicateCheck?.is_duplicate_suspected ? "Duplicate Flagged (Blocked)" : "Save & File QMS Complaint"}
        </button>
      </div>
    </div>
  );
}
