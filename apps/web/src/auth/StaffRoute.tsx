import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function StaffRoute() {
  const { rol } = useAuth();

  if (rol === 'ARRENDATARIO') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
