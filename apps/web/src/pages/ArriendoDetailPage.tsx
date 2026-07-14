import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ArriendoPropiedad, Pago } from '../api/types';

function formatMonto(monto: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat('es-CL').format(new Date(fecha));
}

export function ArriendoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [arriendo, setArriendo] = useState<ArriendoPropiedad | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<ArriendoPropiedad>(`/arriendos-propiedad/${id}`),
      api.get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${id}`),
    ])
      .then(([arriendoData, pagosData]) => {
        setArriendo(arriendoData);
        setPagos(pagosData);
      })
      .catch(() => setError('No se pudo cargar el detalle del arriendo'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!arriendo) return null;

  return (
    <div>
      <Link to="/" className="back-link">
        ← Volver a arriendos
      </Link>

      <div className="page-header">
        <h1>
          {arriendo.propiedad.calle} {arriendo.propiedad.numero}
        </h1>
        <span className={`badge badge--${arriendo.estado.toLowerCase()}`}>{arriendo.estado}</span>
      </div>

      <section className="detail-grid">
        <div className="detail-card">
          <h2>Propiedad</h2>
          <p>
            {arriendo.propiedad.calle} {arriendo.propiedad.numero}, {arriendo.propiedad.ciudad}
          </p>
          <p>
            {arriendo.propiedad.tipo} · {arriendo.propiedad.nHabitaciones} hab ·{' '}
            {arriendo.propiedad.nBanos} baños
          </p>
        </div>

        <div className="detail-card">
          <h2>Arrendatario</h2>
          <p>{arriendo.arrendatario.nombreCompleto}</p>
          <p>{arriendo.arrendatario.rut}</p>
          {arriendo.arrendatario.email && <p>{arriendo.arrendatario.email}</p>}
        </div>

        <div className="detail-card">
          <h2>Condiciones</h2>
          <p>Monto: {formatMonto(arriendo.montoArriendo)}</p>
          <p>Día de pago: {arriendo.fechaPago}</p>
          <p>Entrega: {formatFecha(arriendo.fechaEntrega)}</p>
          <p>Reajuste: {arriendo.periodoAlza}</p>
        </div>
      </section>

      <section>
        <h2>Pagos</h2>
        {pagos.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}
        {pagos.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Comprometido</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{formatFecha(pago.periodo)}</td>
                    <td>{formatFecha(pago.fechaComprometida)}</td>
                    <td>{formatMonto(pago.monto)}</td>
                    <td>
                      <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                        {pago.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
