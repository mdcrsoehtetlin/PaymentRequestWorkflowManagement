import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ApplicantDashboard } from './pages/applicant/ApplicantDashboard';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ApproverDashboard } from './pages/approver/ApproverDashboard';
import { AccountingDashboard } from './pages/accounting/AccountingDashboard';
import { AdminPanel } from './pages/admin/AdminPanel';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        {/* Premium Corporate Navigation Header */}
        <header className="bg-blue-900 border-b border-blue-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-white">
                  PRWM System
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-800 text-blue-200 border border-blue-700">
                  Boilerplate
                </span>
              </div>
              <nav className="flex space-x-4">
                <Link to="/applicant" className="text-sm font-medium text-blue-100 hover:text-white px-3 py-2 rounded-md hover:bg-blue-800 transition">
                  Applicant
                </Link>
                <Link to="/manager" className="text-sm font-medium text-blue-100 hover:text-white px-3 py-2 rounded-md hover:bg-blue-800 transition">
                  Manager
                </Link>
                <Link to="/approver" className="text-sm font-medium text-blue-100 hover:text-white px-3 py-2 rounded-md hover:bg-blue-800 transition">
                  Approver
                </Link>
                <Link to="/accounting" className="text-sm font-medium text-blue-100 hover:text-white px-3 py-2 rounded-md hover:bg-blue-800 transition">
                  Accounting
                </Link>
                <Link to="/admin" className="text-sm font-medium text-blue-100 hover:text-white px-3 py-2 rounded-md hover:bg-blue-800 transition">
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Dynamic Page Router Container */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/applicant" replace />} />
            <Route path="/applicant" element={<ApplicantDashboard />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/approver" element={<ApproverDashboard />} />
            <Route path="/accounting" element={<AccountingDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<div className="p-8 text-center text-slate-500">Page not found</div>} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          &copy; 2026 Payment Request Workflow Management System. All Rights Reserved.
        </footer>
      </div>
    </Router>
  );
};

export default App;
