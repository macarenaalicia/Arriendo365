import type { RequerimientoActualizacion } from '../api/types';
import { formatFechaHora } from '../lib/format';

interface BotonProps {
  actualizaciones: RequerimientoActualizacion[];
  abierto: boolean;
  onToggle: () => void;
}

function IconoHistorial() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 9" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

export function HistorialRequerimientoBoton({ actualizaciones, abierto, onToggle }: BotonProps) {
  if (actualizaciones.length === 0) return null;

  const etiqueta = abierto ? 'Ocultar historial' : `Historial (${actualizaciones.length})`;

  return (
    <button
      type="button"
      className={`historial-toggle${abierto ? ' historial-toggle--abierto' : ''}`}
      onClick={onToggle}
      title={etiqueta}
      aria-label={etiqueta}
    >
      <IconoHistorial />
      <span className="historial-toggle__count">{actualizaciones.length}</span>
    </button>
  );
}

interface FilasProps {
  actualizaciones: RequerimientoActualizacion[];
  // Cantidad total de columnas de la tabla padre, para que la fila de
  // detalle ocupe todo el ancho en una sola celda (colSpan) en vez de
  // repetir columnas de la fila vigente — así la tabla anidada no choca
  // con la columna de Acciones fija a la derecha.
  colSpan: number;
}

// Muestra el historial de cambios de un requerimiento como una tabla propia
// dentro de una fila de detalle, en vez de filas sueltas en la tabla
// principal (eso hacía que la columna de Acciones, fija a la derecha,
// quedara superpuesta sobre datos del historial que no le correspondían).
export function HistorialRequerimientoFilas({ actualizaciones, colSpan }: FilasProps) {
  if (actualizaciones.length === 0) return null;

  return (
    <tr className="table__historial-row">
      <td colSpan={colSpan} className="table__historial-cell">
        <div className="historial-detalle">
          <table className="historial-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Urgencia</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Técnico</th>
                <th>Descripción</th>
                <th>Editado por</th>
              </tr>
            </thead>
            <tbody>
              {actualizaciones.map((a) => (
                <tr key={a.id}>
                  <td>{formatFechaHora(a.createdAt)}</td>
                  <td>
                    <span className={`badge badge--${a.urgencia.toLowerCase()}`}>{a.urgencia}</span>
                  </td>
                  <td>
                    <span className={`badge badge--${a.tipoReparacion.toLowerCase()}`}>
                      {a.tipoReparacion}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge--${a.estado.toLowerCase()}`}>
                      {a.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{a.tecnico?.nombreCompleto ?? ''}</td>
                  <td>{a.notasArrendatario ?? ''}</td>
                  <td>
                    {a.usuario?.persona.nombreCompleto ?? ''}
                    {a.nota && <p className="table__note">{a.nota}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}
