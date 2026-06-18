import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { JwtPayload } from '../types';

interface AuthContextType {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @description Provides authentication state to the entire application.
 * Wrap the root App component with this provider.
 * Exposes: user (JwtPayload), isAuthenticated, isLoading, login(), logout()
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: decode token from localStorage to restore session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const decoded = await authService.getCurrentUser();
        setUser(decoded);
      } catch {
        // Token missing or malformed — treat as unauthenticated
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
