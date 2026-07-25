import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type {
  EstadoRequerimiento,
  Foto,
  Persona,
  Requerimiento,
  UrgenciaRequerimiento,
} from '../api/types';
import { formatFechaHora } from '../lib/format';
import { listarFotos } from '../lib/fotos';
import { useCalificaciones } from '../lib/useCalificaciones';
import { descargarArchivo } from '../lib/descargas';
import { CalificacionSelect } from '../components/CalificacionSelect';
import { TecnicoSelect } from '../components/TecnicoSelect';
import { IconDescargar } from '../components/icons';

const URGENCIAS: UrgenciaRequerimiento[] = ['BAJA', 'MEDIA', 'CRITICA'];
const ESTADOS_REQUERIMIENTO: EstadoRequerimiento[] = [
  'PENDIENTE_REVISION',
  'REVISION_AGENDADA',
  'EN_REVISION',
  'RESUELTO',
  'RECHAZADO',
  'REABIERTO',
];

export function RequerimientoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { rol } = useAuth();
  const esStaff = rol === 'ADMINISTRADOR' || rol === 'PROPIETARIO' || rol === 'TECNICO';
  const esPropietarioOAdmin = rol === 'ADMINISTRADOR' || rol === 'PROPIETARIO';
  const esPropietario = rol === 'PROPIETARIO';

  const [requerimiento, setRequerimiento] = useState<Requerimiento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const { calificaciones, recargarCalificaciones } = useCalificaciones();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    urgencia: 'MEDIA' as UrgenciaRequerimiento,
    calificacionId: '',
    estado: 'PENDIENTE_REVISION' as EstadoRequerimiento,
    tecnicoId: '',
    notasInternas: '',
    detalleResolucion: '',
    inspeccion: '',
    detalleGasto: '',
    totalGasto: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const cargar = () => {
    if (!id) return;
    setLoading(true);
    api
      .get<Requerimiento>(`/requerimientos/${id}`)
      .then(setRequerimiento)
      .catch(() => setError('No se pudo cargar el requerimiento'))
      .finally(() => setLoading(false));
    listarFotos('requerimiento', id).then(setFotos);
  };

  useEffect(cargar, [id]);

  useEffect(() => {
    if (esStaff) {
      api.get<Persona[]>('/personas').then(setPersonas);
    }
  }, [esStaff]);

  const abrirEdicion = () => {
    if (!requerimiento) return;
    setForm({
      urgencia: requerimiento.urgencia,
      calificacionId: requerimiento.calificacionId,
      estado: requerimiento.estado,
      tecnicoId: requerimiento.tecnicoId ?? '',
      notasInternas: requerimiento.notasInternas ?? '',
      detalleResolucion: requerimiento.detalleResolucion ?? '',
      inspeccion: requerimiento.inspeccion ?? '',
      detalleGasto: requerimiento.detalleGasto ?? '',
      totalGasto: requerimiento.totalGasto ?? '',
    });
    setFormError(null);
    setEditando(true);
  };

  const handleGuardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setFormError(null);
    setSaving(true);
    try {
      const actualizado = await api.patch<Requerimiento>(`/requerimientos/${id}`, {
        urgencia: form.urgencia,
        calificacionId: form.calificacionId,
        estado: form.estado,
        tecnicoId: form.tecnicoId || undefined,
        notasInternas: form.notasInternas || undefined,
        detalleResolucion: form.detalleResolucion || undefined,
        inspeccion: esPropietarioOAdmin ? form.inspeccion || undefined : undefined,
        detalleGasto: esPropietario ? form.detalleGasto || undefined : undefined,
        totalGasto: esPropietario && form.totalGasto ? Number(form.totalGasto) : undefined,
      });
      setRequerimiento(actualizado);
      setEditando(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDescargar = async () => {
    if (!id) return;
    setDescargando(true);
    try {
      await descargarArchivo(`/requerimientos/${id}/descarga.pdf`, `requerimiento-${id}.pdf`);
    } finally {
      setDescargando(false);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (error || !requerimiento) return <p className="error-text">{error ?? 'No encontrado'}</p>;

  const propiedad = requerimiento.arriendoPropiedad.propiedad;

  return (
    <div>
      <div className="page-header">
        <h1>
          Requerimiento — {propiedad.calle} {propiedad.numero}
        </h1>
        <div className="page-header__actions">
          <Link to={`/arriendos/${requerimiento.arriendoPropiedadId}`}>Ver arriendo</Link>
          <button
            type="button"
            className="icon-button"
            title="Descargar"
            aria-label="Descargar"
            disabled={descargando}
            onClick={handleDescargar}
          >
            <IconDescargar />
          </button>
          {esStaff && !editando && (
            <button type="button" onClick={abrirEdicion}>
              Editar
            </button>
          )}
        </div>
      </div>

      <section className="detail-card">
        <div className="detail-card__grid">
          <div className="detail-card__item">
            <span className="detail-card__label">Urgencia</span>
            <span className={`badge badge--${requerimiento.urgencia.toLowerCase()}`}>
              {requerimiento.urgencia}
            </span>
          </div>
          <div className="detail-card__item">
            <span className="detail-card__label">Calificación</span>
            <span className="detail-card__value">{requerimiento.calificacion.nombre}</span>
          </div>
          <div className="detail-card__item">
            <span className="detail-card__label">Estado</span>
            <span className={`badge badge--${requerimiento.estado.toLowerCase()}`}>
              {requerimiento.estado.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="detail-card__item">
            <span className="detail-card__label">Técnico</span>
            <span className="detail-card__value">
              {requerimiento.tecnico?.nombreCompleto ?? 'Sin asignar'}
            </span>
          </div>
          <div className="detail-card__item">
            <span className="detail-card__label">Descripción</span>
            <span className="detail-card__value">{requerimiento.notasArrendatario || '—'}</span>
          </div>
          {esStaff && (
            <div className="detail-card__item">
              <span className="detail-card__label">Nota interna</span>
              <span className="detail-card__value">{requerimiento.notasInternas || '—'}</span>
            </div>
          )}
          <div className="detail-card__item">
            <span className="detail-card__label">Detalle de resolución</span>
            <span className="detail-card__value">{requerimiento.detalleResolucion || '—'}</span>
          </div>
          {esPropietarioOAdmin && (
            <div className="detail-card__item">
              <span className="detail-card__label">Inspección</span>
              <span className="detail-card__value">{requerimiento.inspeccion || '—'}</span>
            </div>
          )}
          {esPropietario && (requerimiento.detalleGasto || requerimiento.totalGasto) && (
            <>
              <div className="detail-card__item">
                <span className="detail-card__label">Detalle gasto</span>
                <span className="detail-card__value">{requerimiento.detalleGasto || '—'}</span>
              </div>
              <div className="detail-card__item">
                <span className="detail-card__label">Total gasto</span>
                <span className="detail-card__value">
                  {requerimiento.totalGasto ? `$${Number(requerimiento.totalGasto).toLocaleString('es-CL')}` : '—'}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {editando && (
        <section className="detail-card">
          <h2>Editar requerimiento</h2>
          <form className="inline-form" onSubmit={handleGuardar}>
            <div className="inline-form__grid">
              <label>
                Urgencia
                <select
                  value={form.urgencia}
                  onChange={(e) => setForm({ ...form, urgencia: e.target.value as UrgenciaRequerimiento })}
                >
                  {URGENCIAS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Calificación
                <CalificacionSelect
                  calificaciones={calificaciones}
                  value={form.calificacionId}
                  onChange={(calificacionId) => setForm({ ...form, calificacionId })}
                  permitirCrear
                  onCalificacionCreada={() => recargarCalificaciones()}
                />
              </label>
              <label>
                Estado
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoRequerimiento })}
                >
                  {ESTADOS_REQUERIMIENTO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Técnico asignado
                <TecnicoSelect
                  personas={personas}
                  value={form.tecnicoId}
                  onChange={(tecnicoId) => setForm({ ...form, tecnicoId })}
                  onPersonaCreada={(persona) => setPersonas((prev) => [...prev, persona])}
                />
              </label>
            </div>

            <label>
              Nota interna
              <textarea
                value={form.notasInternas}
                onChange={(e) => setForm({ ...form, notasInternas: e.target.value })}
              />
            </label>

            {form.estado === 'RESUELTO' && (
              <label>
                Detalle de resolución
                <textarea
                  value={form.detalleResolucion}
                  onChange={(e) => setForm({ ...form, detalleResolucion: e.target.value })}
                />
              </label>
            )}

            {esPropietarioOAdmin && (
              <label>
                Inspección
                <textarea
                  value={form.inspeccion}
                  onChange={(e) => setForm({ ...form, inspeccion: e.target.value })}
                />
              </label>
            )}
            {esPropietario && (
              <>
                <label>
                  Detalle gasto
                  <textarea
                    rows={5}
                    value={form.detalleGasto}
                    onChange={(e) => setForm({ ...form, detalleGasto: e.target.value })}
                  />
                </label>
                <label>
                  Total gasto
                  <input
                    type="number"
                    min={0}
                    value={form.totalGasto}
                    onChange={(e) => setForm({ ...form, totalGasto: e.target.value })}
                  />
                </label>
              </>
            )}

            {formError && <p className="auth-card__error">{formError}</p>}

            <div className="table__actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="detail-card">
        <h2>Fotos</h2>
        {fotos.length === 0 && <p className="empty-state">Sin fotos adjuntas.</p>}
        {fotos.length > 0 && (
          <div className="fotos-grid">
            {fotos.map((foto) => (
              <div key={foto.id} className="fotos-grid__item">
                <img src={foto.archivoUrl} alt={foto.descripcion ?? 'Foto del requerimiento'} />
                <span>{foto.descripcion || 'Sin descripción'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {requerimiento.actualizaciones.length > 0 && (
        <section className="detail-card">
          <h2>Historial</h2>
          <div className="table-wrap">
            <table className="historial-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Urgencia</th>
                  <th>Calificación</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Descripción</th>
                  <th>Editado por</th>
                </tr>
              </thead>
              <tbody>
                {requerimiento.actualizaciones.map((a) => (
                  <tr key={a.id}>
                    <td>{formatFechaHora(a.createdAt)}</td>
                    <td>
                      <span className={`badge badge--${a.urgencia.toLowerCase()}`}>{a.urgencia}</span>
                    </td>
                    <td>{a.calificacion.nombre}</td>
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
        </section>
      )}
    </div>
  );
}
