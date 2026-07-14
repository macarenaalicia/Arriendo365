import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';

interface LoginResponse {
  accessToken: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registrarOrganizacion: (dto: {
    nombreOrganizacion: string;
    nombreCompleto: string;
    rut: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));

  const login = async (email: string, password: string) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/login', { email, password });
    setToken(accessToken);
    setIsAuthenticated(true);
  };

  const registrarOrganizacion: AuthContextValue['registrarOrganizacion'] = async (dto) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/registro-organizacion', dto);
    setToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, registrarOrganizacion, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
