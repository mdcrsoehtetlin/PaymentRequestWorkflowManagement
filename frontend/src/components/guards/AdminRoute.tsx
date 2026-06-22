import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { RoleCode } from '../../types';

/**
 * @description Higher-order component for admin-only route protection.
 * Wraps child routes and validates the authenticated user has ADMIN role.
 * Redirects to /login if unauthenticated, /unauthorized if not ADMIN.
 *
 * @example
 * <Route path="/admin/*" element={<AdminRoute />}>
 *   <Route path="users" element={<UserManagementWorkspace />} />
 * </Route>
 */
export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner variant="page" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== RoleCode.ADMIN) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
