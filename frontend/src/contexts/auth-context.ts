import { createContext } from 'react';
import type { JwtPayload } from '../types';

export interface AuthContextType {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<JwtPayload>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
