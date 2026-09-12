import React from 'react';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import ComplaintForm from './components/ComplaintForm';
import CopilotPanel from './components/CopilotPanel';
import ComplaintList from './components/ComplaintList';
import CodeWalkthrough from './components/CodeWalkthrough';

export default function App() {
  const activeTab = useSelector((state) => state.complaint.activeTab);
  const successMessage = useSelector((state) => state.complaint.successMessage);
  const error = useSelector((state) => state.complaint.error);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation */}
      <Navbar />

      {/* Global Toast / Alert Notifications */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-3 w-full">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-semibold shadow-sm">
            {successMessage}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-3 w-full">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-xs font-semibold shadow-sm">
            Error: {error}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'log' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Left 7 Columns: Form */}
            <div className="lg:col-span-7 h-full">
              <ComplaintForm />
            </div>

            {/* Right 5 Columns: AI Copilot & Risk Assessment */}
            <div className="lg:col-span-5 h-full">
              <CopilotPanel />
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="h-[calc(100vh-140px)]">
            <ComplaintList />
          </div>
        ) : (
          <div className="h-[calc(100vh-140px)]">
            <CodeWalkthrough />
          </div>
        )}
      </main>
    </div>
  );
}
