import { useAuthContext } from '../contexts/AuthContext';
import type { JwtPayload } from '../types';

interface UseAuthReturn {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * @description Logs the user in and updates the context state
   * @param email - The user's email address
   * @param password - The user's password
   * @returns The decoded JWT payload for immediate use
   */
  login: (email: string, password: string) => Promise<JwtPayload>;
  /**
   * @description Logs the user out and clears the session
   * @returns A promise that resolves when logout is complete
   */
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
