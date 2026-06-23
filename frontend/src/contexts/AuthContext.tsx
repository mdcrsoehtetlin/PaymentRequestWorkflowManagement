import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthContext, type AuthContextType } from './auth-context';
import { authService } from '../services/auth.service';

/**
 * @description Provides authentication state to the entire application.
 * Wrap the root App component with this provider.
 * Exposes: user (JwtPayload), isAuthenticated, isLoading, login(), logout()
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const decoded = await authService.getCurrentUser();
        setUser(decoded);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthContextType['user']> => {
    await authService.login(email, password);
    const decoded = await authService.getCurrentUser();
    setUser(decoded);
    return decoded;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
