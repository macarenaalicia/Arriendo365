import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EstadoPago, ResumenPagos } from '../api/types';

const ESTADO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ATRASADO: 'Atrasado',
  RECHAZADO: 'Rechazado',
};

function formatMonto(monto: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
}

export function PagosResumenPage() {
  const [resumen, setResumen] = useState<ResumenPagos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ResumenPagos>('/pagos/resumen')
      .then(setResumen)
      .catch(() => setError('No se pudo cargar el resumen de pagos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!resumen) return null;

  return (
    <div>
      <h1>Resumen de pagos</h1>

      <div className="stat-grid">
        <div className="stat-card stat-card--total">
          <span className="stat-card__label">Total general</span>
          <span className="stat-card__value">{formatMonto(resumen.montoTotalGeneral)}</span>
        </div>

        {(Object.entries(resumen.porEstado) as [EstadoPago, { cantidad: number; montoTotal: number }][]).map(
          ([estado, datos]) => (
            <div key={estado} className={`stat-card stat-card--${estado.toLowerCase()}`}>
              <span className="stat-card__label">{ESTADO_LABELS[estado]}</span>
              <span className="stat-card__value">{formatMonto(datos.montoTotal)}</span>
              <span className="stat-card__count">{datos.cantidad} pago(s)</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
