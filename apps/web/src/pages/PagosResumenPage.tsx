import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ArriendoAuto, ArriendoPropiedad, EstadoPago, Pago, ResumenPagos } from '../api/types';
import { formatFecha } from '../lib/format';

const ESTADO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ATRASADO: 'Atrasado',
  RECHAZADO: 'Rechazado',
};

const ESTADOS_PAGO: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'];

type Vista = 'default' | 'todos' | 'pendientes' | 'mes';

const VISTA_LABELS: Record<Vista, string> = {
  default: 'Pendientes + mes actual',
  todos: 'Todos',
  pendientes: 'Solo pendientes de aprobación',
  mes: 'Solo mes actual',
};

function formatMonto(monto: number | string) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

function esMesActual(fechaIso: string): boolean {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return fechaIso.slice(0, 7) === mesActual;
}

interface ReferenciaArriendo {
  label: string;
  link: string | null;
}

export function PagosResumenPage() {
  const [resumen, setResumen] = useState<ResumenPagos | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [referencias, setReferencias] = useState<Record<string, ReferenciaArriendo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vista, setVista] = useState<Vista>('default');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPago | ''>('');

  const cargarPagos = () => {
    api.get<Pago[]>('/pagos').then(setPagos);
  };

  useEffect(() => {
    Promise.all([
      api.get<ResumenPagos>('/pagos/resumen'),
      api.get<Pago[]>('/pagos'),
      api.get<ArriendoPropiedad[]>('/arriendos-propiedad'),
      api.get<ArriendoAuto[]>('/arriendos-auto'),
    ])
      .then(([resumenData, pagosData, arriendosPropiedad, arriendosAuto]) => {
        setResumen(resumenData);
        setPagos(pagosData);

        const mapa: Record<string, ReferenciaArriendo> = {};
        arriendosPropiedad.forEach((a) => {
          mapa[`propiedad-${a.id}`] = {
            label: `${a.propiedad.calle} ${a.propiedad.numero} — ${a.arrendatario.nombreCompleto}`,
            link: `/arriendos/${a.id}`,
          };
        });
        arriendosAuto.forEach((a) => {
          mapa[`auto-${a.id}`] = {
            label: a.arrendatario.nombreCompleto,
            link: null,
          };
        });
        setReferencias(mapa);
      })
      .catch(() => setError('No se pudo cargar el resumen de pagos'))
      .finally(() => setLoading(false));
  }, []);

  const handleAprobar = async (pagoId: string) => {
    await api.patch(`/pagos/${pagoId}`, { aprobado: true, estado: 'PAGADO' });
    cargarPagos();
  };

  const handleRechazar = async (pagoId: string) => {
    if (!confirm('¿Rechazar este pago?')) return;
    await api.patch(`/pagos/${pagoId}`, { aprobado: false, estado: 'RECHAZADO' });
    cargarPagos();
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!resumen) return null;

  const pagosFiltrados = pagos
    .filter((pago) => {
      if (filtroEstado && pago.estado !== filtroEstado) return false;
      if (vista === 'pendientes') return pago.aprobado === null;
      if (vista === 'mes') return esMesActual(pago.periodo);
      if (vista === 'todos') return true;
      return pago.aprobado === null || esMesActual(pago.periodo);
    })
    .sort((a, b) => b.periodo.localeCompare(a.periodo));

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

      <section>
        <div className="page-header">
          <h2>Pagos registrados</h2>
          <div className="page-header__actions">
            <select value={vista} onChange={(e) => setVista(e.target.value as Vista)}>
              {(Object.keys(VISTA_LABELS) as Vista[]).map((v) => (
                <option key={v} value={v}>
                  {VISTA_LABELS[v]}
                </option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoPago | '')}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_PAGO.map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pagosFiltrados.length === 0 && (
          <p className="empty-state">No hay pagos que coincidan con este filtro.</p>
        )}
        {pagosFiltrados.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Arriendo</th>
                  <th>Fecha de pago</th>
                  <th>Periodo de pago</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Medio de pago</th>
                  <th>Estado</th>
                  <th>Aprobación</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago) => {
                  const ref = referencias[`${pago.arriendoTipo}-${pago.arriendoId}`];
                  return (
                    <tr key={pago.id}>
                      <td>
                        {ref?.link ? (
                          <Link to={ref.link}>{ref.label}</Link>
                        ) : (
                          (ref?.label ?? '—')
                        )}
                      </td>
                      <td>{formatFecha(pago.periodo)}</td>
                      <td>{formatFecha(pago.fechaComprometida)}</td>
                      <td>{formatMonto(pago.monto)}</td>
                      <td>{pago.esAbono ? 'Abono' : 'Completo'}</td>
                      <td>{pago.medioPago ?? ''}</td>
                      <td>
                        <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                          {pago.estado}
                        </span>
                      </td>
                      <td>
                        {pago.aprobado === true && (
                          <span className="badge badge--activo">Aprobado</span>
                        )}
                        {pago.aprobado === false && (
                          <span className="badge badge--rechazado">Rechazado</span>
                        )}
                        {pago.aprobado === null && (
                          <div className="table__actions">
                            <span className="badge badge--pendiente">Pendiente</span>
                            <button type="button" onClick={() => handleAprobar(pago.id)}>
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleRechazar(pago.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
