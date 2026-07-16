import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { descargarCsv } from '../lib/exportarCsv';
import { Modal } from '../components/Modal';
import { IconEditar, IconRechazar } from '../components/icons';
import {
  HistorialRequerimientoBoton,
  HistorialRequerimientoFilas,
} from '../components/HistorialRequerimiento';
import type {
  ArriendoPropiedad,
  EstadoRequerimiento,
  Persona,
  Requerimiento,
  TipoReparacion,
  UrgenciaRequerimiento,
} from '../api/types';

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

const EDIT_FORM_INICIAL = {
  urgencia: 'MEDIA' as UrgenciaRequerimiento,
  tipoReparacion: 'LOCATIVA' as TipoReparacion,
  estado: 'PENDIENTE_REVISION' as EstadoRequerimiento,
  tecnicoId: '',
  notasInternas: '',
  notasArrendatario: '',
  detalleResolucion: '',
};

const CREATE_FORM_INICIAL = {
  arriendoPropiedadId: '',
  urgencia: 'MEDIA' as UrgenciaRequerimiento,
  tipoReparacion: 'LOCATIVA' as TipoReparacion,
  notasArrendatario: '',
};

export function RequerimientosResumenPage() {
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<EstadoRequerimiento | ''>('');
  const [filtroUrgencia, setFiltroUrgencia] = useState<UrgenciaRequerimiento | ''>('');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EDIT_FORM_INICIAL);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [historialAbiertoId, setHistorialAbiertoId] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(CREATE_FORM_INICIAL);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const cargarRequerimientos = () => {
    const params = new URLSearchParams();
    if (filtroEstado) params.set('estado', filtroEstado);
    if (filtroUrgencia) params.set('urgencia', filtroUrgencia);
    const query = params.toString();
    api.get<Requerimiento[]>(`/requerimientos${query ? `?${query}` : ''}`).then(setRequerimientos);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<ArriendoPropiedad[]>('/arriendos-propiedad'),
      api.get<Persona[]>('/personas'),
    ])
      .then(([arriendosData, personasData]) => {
        setArriendos(arriendosData);
        setPersonas(personasData);
      })
      .catch(() => setLoadError('No se pudo cargar la información'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(cargarRequerimientos, [filtroEstado, filtroUrgencia]);
  useEffect(() => setSeleccionados(new Set()), [filtroEstado, filtroUrgencia]);

  const arriendosPorId: Record<string, ArriendoPropiedad> = {};
  arriendos.forEach((a) => {
    arriendosPorId[a.id] = a;
  });

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const todosSeleccionados =
    requerimientos.length > 0 && requerimientos.every((r) => seleccionados.has(r.id));

  const toggleSeleccionarTodos = () => {
    setSeleccionados(todosSeleccionados ? new Set() : new Set(requerimientos.map((r) => r.id)));
  };

  const handleDescargarExcel = () => {
    const filas = requerimientos
      .filter((req) => seleccionados.has(req.id))
      .map((req) => {
        const arriendo = arriendosPorId[req.arriendoPropiedadId];
        return [
          arriendo ? `${arriendo.propiedad.calle} ${arriendo.propiedad.numero}` : '',
          arriendo?.arrendatario.nombreCompleto ?? '',
          req.urgencia,
          req.tipoReparacion,
          req.estado.replace(/_/g, ' '),
          req.tecnico?.nombreCompleto ?? '',
          req.notasArrendatario ?? '',
          req.notasInternas ?? '',
          req.detalleResolucion ?? '',
        ];
      });

    descargarCsv(
      `requerimientos_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Propiedad',
        'Arrendatario',
        'Urgencia',
        'Tipo',
        'Estado',
        'Técnico',
        'Descripción',
        'Nota interna',
        'Detalle resolución',
      ],
      filas,
    );
  };

  const cerrarForm = () => {
    setEditingId(null);
    setForm(EDIT_FORM_INICIAL);
    setFormError(null);
  };

  const abrirEdicion = (req: Requerimiento) => {
    cerrarCreacion();
    setForm({
      urgencia: req.urgencia,
      tipoReparacion: req.tipoReparacion,
      estado: req.estado,
      tecnicoId: req.tecnicoId ?? '',
      notasInternas: req.notasInternas ?? '',
      notasArrendatario: req.notasArrendatario ?? '',
      detalleResolucion: req.detalleResolucion ?? '',
    });
    setEditingId(req.id);
    setFormError(null);
  };

  const cerrarCreacion = () => {
    setShowCreateForm(false);
    setCreateForm(CREATE_FORM_INICIAL);
    setCreateError(null);
  };

  const abrirCreacion = () => {
    cerrarForm();
    setCreateForm(CREATE_FORM_INICIAL);
    setCreateError(null);
    setShowCreateForm(true);
  };

  const handleCrear = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.arriendoPropiedadId) {
      setCreateError('Elige a qué arriendo corresponde.');
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      await api.post('/requerimientos', {
        arriendoPropiedadId: createForm.arriendoPropiedadId,
        urgencia: createForm.urgencia,
        tipoReparacion: createForm.tipoReparacion,
        notasArrendatario: createForm.notasArrendatario || undefined,
      });
      cerrarCreacion();
      cargarRequerimientos();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'No se pudo crear el requerimiento');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;
    setFormError(null);
    setSaving(true);
    try {
      await api.patch(`/requerimientos/${editingId}`, {
        urgencia: form.urgencia,
        tipoReparacion: form.tipoReparacion,
        estado: form.estado,
        tecnicoId: form.tecnicoId || undefined,
        notasInternas: form.notasInternas || undefined,
        notasArrendatario: form.notasArrendatario || undefined,
        detalleResolucion: form.detalleResolucion || undefined,
      });
      cerrarForm();
      cargarRequerimientos();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el requerimiento');
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async (reqId: string) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo === null) return;
    if (!motivo.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }
    await api.patch(`/requerimientos/${reqId}`, {
      estado: 'RECHAZADO',
      notaActualizacion: motivo.trim(),
    });
    if (editingId === reqId) cerrarForm();
    cargarRequerimientos();
  };

  const handleReabrir = async (reqId: string) => {
    await api.patch(`/requerimientos/${reqId}`, { estado: 'REABIERTO' });
    cargarRequerimientos();
  };

  if (loading) return <p>Cargando…</p>;
  if (loadError) return <p className="error-text">{loadError}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Requerimientos</h1>
        <div className="page-header__actions">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoRequerimiento | '')}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_REQUERIMIENTO.map((estado) => (
              <option key={estado} value={estado}>
                {estado.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={filtroUrgencia}
            onChange={(e) => setFiltroUrgencia(e.target.value as UrgenciaRequerimiento | '')}
          >
            <option value="">Todas las urgencias</option>
            {URGENCIAS.map((urgencia) => (
              <option key={urgencia} value={urgencia}>
                {urgencia}
              </option>
            ))}
          </select>
          <button type="button" onClick={abrirCreacion}>
            + Nuevo requerimiento
          </button>
          {seleccionados.size > 0 && (
            <button type="button" onClick={handleDescargarExcel}>
              Descargar Excel ({seleccionados.size})
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <Modal titulo="Nuevo requerimiento" onClose={cerrarCreacion}>
        <form className="inline-form" onSubmit={handleCrear}>
          <div className="inline-form__grid">
            <label>
              Arriendo
              <select
                required
                value={createForm.arriendoPropiedadId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, arriendoPropiedadId: e.target.value })
                }
              >
                <option value="">Elige un arriendo…</option>
                {arriendos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.propiedad.calle} {a.propiedad.numero} — {a.arrendatario.nombreCompleto} (
                    {a.estado})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Urgencia
              <select
                value={createForm.urgencia}
                onChange={(e) =>
                  setCreateForm({ ...createForm, urgencia: e.target.value as UrgenciaRequerimiento })
                }
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
                value={createForm.tipoReparacion}
                onChange={(e) =>
                  setCreateForm({ ...createForm, tipoReparacion: e.target.value as TipoReparacion })
                }
              >
                {TIPOS_REPARACION.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Descripción
            <textarea
              placeholder="Describe el problema…"
              value={createForm.notasArrendatario}
              onChange={(e) => setCreateForm({ ...createForm, notasArrendatario: e.target.value })}
            />
          </label>

          {createError && <p className="auth-card__error">{createError}</p>}

          <button type="submit" disabled={creating}>
            {creating ? 'Guardando…' : 'Reportar'}
          </button>
        </form>
        </Modal>
      )}

      {editingId && (
        <Modal titulo="Editar requerimiento" onClose={cerrarForm}>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Urgencia
              <select
                value={form.urgencia}
                onChange={(e) =>
                  setForm({ ...form, urgencia: e.target.value as UrgenciaRequerimiento })
                }
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
                onChange={(e) =>
                  setForm({ ...form, estado: e.target.value as EstadoRequerimiento })
                }
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
            Descripción
            <textarea
              value={form.notasArrendatario}
              onChange={(e) => setForm({ ...form, notasArrendatario: e.target.value })}
            />
          </label>

          <label>
            Nota interna (uso interno del staff, el arrendatario no la ve)
            <textarea
              placeholder="Ej. contacto del técnico, instrucciones de acceso, etc."
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
            <button type="button" onClick={cerrarForm}>
              Cancelar
            </button>
          </div>
        </form>
        </Modal>
      )}

      {requerimientos.length === 0 && (
        <p className="empty-state">No hay requerimientos que coincidan con este filtro.</p>
      )}
      {requerimientos.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={toggleSeleccionarTodos}
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th>Arriendo</th>
                <th>Urgencia</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Técnico</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requerimientos.map((req) => {
                const arriendo = arriendosPorId[req.arriendoPropiedadId];
                const historialAbierto = historialAbiertoId === req.id;
                return (
                  <Fragment key={req.id}>
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(req.id)}
                          onChange={() => toggleSeleccion(req.id)}
                          aria-label={`Seleccionar requerimiento de ${arriendo?.propiedad.calle ?? ''}`}
                        />
                      </td>
                      <td>
                        {arriendo ? (
                          <Link to={`/arriendos/${arriendo.id}`}>
                            {arriendo.propiedad.calle} {arriendo.propiedad.numero} —{' '}
                            {arriendo.arrendatario.nombreCompleto}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className={`badge badge--${req.urgencia.toLowerCase()}`}>
                          {req.urgencia}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${req.tipoReparacion.toLowerCase()}`}>
                          {req.tipoReparacion}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${req.estado.toLowerCase()}`}>
                          {req.estado.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{req.tecnico?.nombreCompleto ?? ''}</td>
                      <td className="table__cell-truncate" title={req.notasArrendatario ?? ''}>
                        {req.notasArrendatario ?? ''}
                      </td>
                      <td>
                        <div className="table__actions">
                          {req.estado === 'RESUELTO' || req.estado === 'RECHAZADO' ? (
                            <button type="button" onClick={() => handleReabrir(req.id)}>
                              Reabrir
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="icon-button"
                                title="Editar"
                                aria-label="Editar"
                                onClick={() => abrirEdicion(req)}
                              >
                                <IconEditar />
                              </button>
                              <button
                                type="button"
                                className="icon-button icon-button--danger"
                                title="Rechazar"
                                aria-label="Rechazar"
                                onClick={() => handleRechazar(req.id)}
                              >
                                <IconRechazar />
                              </button>
                            </>
                          )}
                          <HistorialRequerimientoBoton
                            actualizaciones={req.actualizaciones}
                            abierto={historialAbierto}
                            onToggle={() =>
                              setHistorialAbiertoId(historialAbierto ? null : req.id)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    {historialAbierto && (
                      <HistorialRequerimientoFilas
                        actualizaciones={req.actualizaciones}
                        colSpan={8}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
