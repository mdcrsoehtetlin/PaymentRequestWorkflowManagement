import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthContext } from './auth-context';
import { authService } from '../services/auth.service';
import type { JwtPayload } from '../types';

/**
 * @description Provides authentication state to the entire application.
 * Wrap the root App component with this provider.
 * Exposes: user (JwtPayload), isAuthenticated, isLoading, login(), logout()
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
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

  const login = useCallback(async (email: string, password: string): Promise<JwtPayload> => {
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
