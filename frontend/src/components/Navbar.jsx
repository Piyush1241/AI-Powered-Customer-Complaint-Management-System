import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab } from '../store/complaintSlice';
import { ShieldCheck, FileText, LayoutDashboard, Sparkles, Code2 } from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.complaint.activeTab);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 text-white p-2 rounded-lg shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-gray-900 tracking-tight">AIVOA QMS</span>
                <span className="bg-blue-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded border border-blue-200">
                  Pharma Edition
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Customer Complaint Management System (API & FDF)</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-2">
            <button
              onClick={() => dispatch(setActiveTab('log'))}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'log'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Log Complaint & Copilot</span>
            </button>

            <button
              onClick={() => dispatch(setActiveTab('dashboard'))}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>QMS Dashboard</span>
            </button>

            <button
              id="tab-walkthrough"
              onClick={() => dispatch(setActiveTab('walkthrough'))}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'walkthrough'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold border border-blue-200'
              }`}
            >
              <Code2 className="h-4 w-4" />
              <span>Code Walkthrough (Video 2)</span>
            </button>
          </nav>

          {/* Regulatory Compliance Badge */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>21 CFR Part 820 / ICH Q10 Compliant</span>
          </div>

        </div>
      </div>
    </header>
  );
}
