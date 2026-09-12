import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchComplaints } from '../store/complaintSlice';
import { LayoutDashboard, CheckCircle2, Clock, AlertOctagon, RefreshCw, FileText } from 'lucide-react';

export default function ComplaintList() {
  const dispatch = useDispatch();
  const { complaintList, loading } = useSelector((state) => state.complaint);

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-brand-600" />
            QMS Complaint Registry & Audit Trail
          </h2>
          <p className="text-xs text-gray-500">21 CFR Part 11 logged record history</p>
        </div>

        <button
          onClick={() => dispatch(fetchComplaints())}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Complaint List Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {complaintList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            No QMS complaints logged yet. Use the Log Complaint panel to submit one.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Complaint #</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Batch #</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Reporter</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {complaintList.map((c) => {
                const severity = c.risk_assessment?.severity || 'Minor';
                return (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-brand-700">{c.complaint_number}</td>
                    <td className="py-3 px-3 font-medium text-gray-900">{c.product_name || 'N/A'}</td>
                    <td className="py-3 px-3 font-mono text-gray-600">{c.batch_number || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        severity === 'Critical'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : severity === 'Major'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{c.reporter_name || 'N/A'}</td>
                    <td className="py-3 px-3 text-gray-500">{c.date_received || c.created_at?.slice(0, 10)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
