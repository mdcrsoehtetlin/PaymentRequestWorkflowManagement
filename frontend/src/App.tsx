import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { ApplicantDashboard } from './pages/applicant/ApplicantDashboard';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ApproverDashboard } from './pages/approver/ApproverDashboard';
import { AccountingDashboard } from './pages/accounting/AccountingDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/applicant/*" element={
            <ProtectedRoute allowedRoles={[1]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/manager/*" element={
            <ProtectedRoute allowedRoles={[2]}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/approver/*" element={
            <ProtectedRoute allowedRoles={[3]}>
              <ApproverDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/accounting/*" element={
            <ProtectedRoute allowedRoles={[4]}>
              <AccountingDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={[5]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/unauthorized" element={
            <div className="flex h-screen items-center justify-center bg-slate-50">
              <div className="bg-white p-8 rounded-xl shadow text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Unauthorized</h1>
                <p className="text-slate-600">You do not have permission to view this page.</p>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
