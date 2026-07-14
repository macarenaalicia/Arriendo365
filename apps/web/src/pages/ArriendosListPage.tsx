import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ArriendoPropiedad, EstadoArriendo } from '../api/types';

const ESTADOS: Array<{ value: EstadoArriendo | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
  { value: 'TERMINADO', label: 'Terminados' },
];

function formatMonto(monto: string) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

export function ArriendosListPage() {
  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [estado, setEstado] = useState<EstadoArriendo | ''>('ACTIVO');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const query = estado ? `?estado=${estado}` : '';
    api
      .get<ArriendoPropiedad[]>(`/arriendos-propiedad${query}`)
      .then(setArriendos)
      .catch(() => setError('No se pudieron cargar los arriendos'))
      .finally(() => setLoading(false));
  }, [estado]);

  return (
    <div>
      <div className="page-header">
        <h1>Arriendos</h1>
        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoArriendo | '')}>
          {ESTADOS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && arriendos.length === 0 && (
        <p className="empty-state">No hay arriendos {estado ? estado.toLowerCase() : ''}.</p>
      )}

      <div className="card-list">
        {arriendos.map((arriendo) => (
          <Link key={arriendo.id} to={`/arriendos/${arriendo.id}`} className="card">
            <div className="card__title">
              {arriendo.propiedad.calle} {arriendo.propiedad.numero}
            </div>
            <div className="card__subtitle">{arriendo.arrendatario.nombreCompleto}</div>
            <div className="card__row">
              <span className={`badge badge--${arriendo.estado.toLowerCase()}`}>
                {arriendo.estado}
              </span>
              <span>{formatMonto(arriendo.montoArriendo)}/mes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
