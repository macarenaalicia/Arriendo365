import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type {
  EstadoRequerimiento,
  Foto,
  Persona,
  Requerimiento,
  TipoReparacion,
  UrgenciaRequerimiento,
} from '../api/types';
import { formatFechaHora } from '../lib/format';
import { listarFotos } from '../lib/fotos';

const URGENCIAS: UrgenciaRequerimiento[] = ['BAJA', 'MEDIA', 'CRITICA'];
const TIPOS_REPARACION: TipoReparacion[] = ['LOCATIVA', 'ESTRUCTURAL'];
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

  const [requerimiento, setRequerimiento] = useState<Requerimiento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    urgencia: 'MEDIA' as UrgenciaRequerimiento,
    tipoReparacion: 'LOCATIVA' as TipoReparacion,
    estado: 'PENDIENTE_REVISION' as EstadoRequerimiento,
    tecnicoId: '',
    notasInternas: '',
    detalleResolucion: '',
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
      tipoReparacion: requerimiento.tipoReparacion,
      estado: requerimiento.estado,
      tecnicoId: requerimiento.tecnicoId ?? '',
      notasInternas: requerimiento.notasInternas ?? '',
      detalleResolucion: requerimiento.detalleResolucion ?? '',
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
        tipoReparacion: form.tipoReparacion,
        estado: form.estado,
        tecnicoId: form.tecnicoId || undefined,
        notasInternas: form.notasInternas || undefined,
        detalleResolucion: form.detalleResolucion || undefined,
      });
      setRequerimiento(actualizado);
      setEditando(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
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
            <span className="detail-card__label">Tipo</span>
            <span className={`badge badge--${requerimiento.tipoReparacion.toLowerCase()}`}>
              {requerimiento.tipoReparacion}
            </span>
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
                Tipo de reparación
                <select
                  value={form.tipoReparacion}
                  onChange={(e) =>
                    setForm({ ...form, tipoReparacion: e.target.value as TipoReparacion })
                  }
                >
                  {TIPOS_REPARACION.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
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
                <select
                  value={form.tecnicoId}
                  onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}
                >
                  <option value="">Sin asignar</option>
                  {personas
                    .filter((p) => p.tipoPersona === 'TECNICO' || p.id === form.tecnicoId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombreCompleto}
                      </option>
                    ))}
                </select>
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
                  <th>Tipo</th>
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
        </section>
      )}
    </div>
  );
}
