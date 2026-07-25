import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, debeCambiarPassword } = useAuth();
  const { pathname } = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (debeCambiarPassword && pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }

  return <Outlet />;
}
