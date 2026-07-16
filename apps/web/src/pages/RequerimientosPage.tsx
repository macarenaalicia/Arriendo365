import { useAuth } from '../auth/AuthContext';
import { RequerimientosResumenPage } from './RequerimientosResumenPage';
import { RequerimientosArrendatarioPage } from './RequerimientosArrendatarioPage';

export function RequerimientosPage() {
  const { rol } = useAuth();
  return rol === 'ARRENDATARIO' ? <RequerimientosArrendatarioPage /> : <RequerimientosResumenPage />;
}
