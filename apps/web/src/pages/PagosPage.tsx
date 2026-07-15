import { useAuth } from '../auth/AuthContext';
import { PagosResumenPage } from './PagosResumenPage';
import { PagosArrendatarioPage } from './PagosArrendatarioPage';

export function PagosPage() {
  const { rol } = useAuth();
  return rol === 'ARRENDATARIO' ? <PagosArrendatarioPage /> : <PagosResumenPage />;
}
