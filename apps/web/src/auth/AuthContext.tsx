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
  organizacionId: string | null;
  nombreCompleto: string | null;
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

interface DatosToken {
  rol: RolUsuario | null;
  organizacionId: string | null;
  nombreCompleto: string | null;
}

function datosDesdeToken(token: string | null): DatosToken {
  const payload = token ? decodeJwtPayload(token) : null;
  return {
    rol: (payload?.rol as RolUsuario) ?? null,
    organizacionId: payload?.organizacionId ?? null,
    nombreCompleto: payload?.nombreCompleto ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));
  const [rol, setRol] = useState<RolUsuario | null>(() => datosDesdeToken(getToken()).rol);
  const [organizacionId, setOrganizacionId] = useState<string | null>(
    () => datosDesdeToken(getToken()).organizacionId,
  );
  const [nombreCompleto, setNombreCompleto] = useState<string | null>(
    () => datosDesdeToken(getToken()).nombreCompleto,
  );

  const aplicarToken = (accessToken: string) => {
    setToken(accessToken);
    setIsAuthenticated(true);
    const datos = datosDesdeToken(accessToken);
    setRol(datos.rol);
    setOrganizacionId(datos.organizacionId);
    setNombreCompleto(datos.nombreCompleto);
  };

  const login = async (email: string, password: string) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/login', { email, password });
    aplicarToken(accessToken);
  };

  const registrarOrganizacion: AuthContextValue['registrarOrganizacion'] = async (dto) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/registro-organizacion', dto);
    aplicarToken(accessToken);
  };

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
    setRol(null);
    setOrganizacionId(null);
    setNombreCompleto(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        rol,
        organizacionId,
        nombreCompleto,
        login,
        registrarOrganizacion,
        logout,
      }}
    >
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
