import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { JwtPayload } from '../types';

interface UseAuthReturn {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      authService.getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setIsLoading(false));
    } catch {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    const payload = await authService.getCurrentUser();
    setUser(payload);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return { user, isAuthenticated: !!user, isLoading, login, logout };
}
