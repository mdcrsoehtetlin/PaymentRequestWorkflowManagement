import { useAuthContext } from './useAuthContext';
import type { JwtPayload } from '../types';

interface UseAuthReturn {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<JwtPayload>;
  logout: () => Promise<void>;
}

/**
 * @description Convenience hook for consuming auth state.
 * Thin wrapper around useAuthContext() — single source of truth.
 * Use this hook in all components instead of directly calling useAuthContext().
 *
 * @returns The authentication context value containing user state and methods
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  return useAuthContext();
}
