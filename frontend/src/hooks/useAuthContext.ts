import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '../contexts/auth-context';

/**
 * @description Hook to consume the AuthContext.
 * Must be called inside a component tree wrapped by <AuthProvider>.
 * @throws Error if used outside of AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
