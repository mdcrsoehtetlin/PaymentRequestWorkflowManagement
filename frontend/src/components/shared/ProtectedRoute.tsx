import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  /** Role codes that can access this route. E.g. ['APPLICANT'] */
  allowedRoles?: string[];
  children: React.ReactNode;
}

/**
 * @description Route guard component. Redirects to /login if not authenticated.
 * Redirects to /unauthorized if authenticated but role not in allowedRoles.
 * Shows a full-page spinner during auth state initialization.
 *
 * @example
 * <ProtectedRoute allowedRoles={['APPLICANT']}>
 *   <ApplicantDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner variant="page" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
