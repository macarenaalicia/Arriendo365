import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import { decodeJwtPayload } from '../lib/jwt';
import type { RolUsuario } from '../api/types';

interface LoginResponse {
  accessToken: string;
  debeCambiarPassword?: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  rol: RolUsuario | null;
  organizacionId: string | null;
  usuarioId: string | null;
  nombreCompleto: string | null;
  debeCambiarPassword: boolean;
  marcarPasswordCambiada: () => void;
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
  usuarioId: string | null;
  nombreCompleto: string | null;
}

function datosDesdeToken(token: string | null): DatosToken {
  const payload = token ? decodeJwtPayload(token) : null;
  return {
    rol: (payload?.rol as RolUsuario) ?? null,
    organizacionId: payload?.organizacionId ?? null,
    usuarioId: payload?.sub ?? null,
    nombreCompleto: payload?.nombreCompleto ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));
  const [rol, setRol] = useState<RolUsuario | null>(() => datosDesdeToken(getToken()).rol);
  const [organizacionId, setOrganizacionId] = useState<string | null>(
    () => datosDesdeToken(getToken()).organizacionId,
  );
  const [usuarioId, setUsuarioId] = useState<string | null>(
    () => datosDesdeToken(getToken()).usuarioId,
  );
  const [nombreCompleto, setNombreCompleto] = useState<string | null>(
    () => datosDesdeToken(getToken()).nombreCompleto,
  );
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<{ debeCambiarPassword: boolean }>('/perfil')
      .then((perfil) => setDebeCambiarPassword(perfil.debeCambiarPassword))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const aplicarToken = (accessToken: string) => {
    setToken(accessToken);
    setIsAuthenticated(true);
    const datos = datosDesdeToken(accessToken);
    setRol(datos.rol);
    setOrganizacionId(datos.organizacionId);
    setUsuarioId(datos.usuarioId);
    setNombreCompleto(datos.nombreCompleto);
  };

  const login = async (email: string, password: string) => {
    const { accessToken, debeCambiarPassword: debeCambiar } = await api.post<LoginResponse>(
      '/auth/login',
      { email, password },
    );
    aplicarToken(accessToken);
    setDebeCambiarPassword(debeCambiar ?? false);
  };

  const registrarOrganizacion: AuthContextValue['registrarOrganizacion'] = async (dto) => {
    const { accessToken } = await api.post<LoginResponse>('/auth/registro-organizacion', dto);
    aplicarToken(accessToken);
  };

  const marcarPasswordCambiada = () => setDebeCambiarPassword(false);

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
    setRol(null);
    setOrganizacionId(null);
    setUsuarioId(null);
    setNombreCompleto(null);
    setDebeCambiarPassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        rol,
        organizacionId,
        usuarioId,
        nombreCompleto,
        debeCambiarPassword,
        marcarPasswordCambiada,
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
