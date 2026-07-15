import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import { decodeJwtPayload } from '../lib/jwt';
import type { RolUsuario } from '../api/types';

interface LoginResponse {
  accessToken: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  rol: RolUsuario | null;
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

function rolDesdeToken(): RolUsuario | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return (payload?.rol as RolUsuario) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));
  const [rol, setRol] = useState<RolUsuario | null>(rolDesdeToken);

  const login = async (email: string, password: string) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/login', { email, password });
    setToken(accessToken);
    setIsAuthenticated(true);
    setRol(decodeJwtPayload(accessToken)?.rol as RolUsuario);
  };

  const registrarOrganizacion: AuthContextValue['registrarOrganizacion'] = async (dto) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/registro-organizacion', dto);
    setToken(accessToken);
    setIsAuthenticated(true);
    setRol(decodeJwtPayload(accessToken)?.rol as RolUsuario);
  };

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
    setRol(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, rol, login, registrarOrganizacion, logout }}>
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
