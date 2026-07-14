import { Fragment, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type {
  ArriendoAuto,
  Auto,
  ConfiguracionMantencion,
  EstadoArriendo,
  EstadoAuto,
  MantencionAuto,
  Persona,
} from '../api/types';
import { formatEnumLabel } from '../lib/format';

const ESTADOS: EstadoAuto[] = ['DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION'];
const ESTADOS_ARRIENDO: EstadoArriendo[] = ['ACTIVO', 'INACTIVO', 'TERMINADO'];

const FORM_INICIAL = { patente: '', kilometraje: '' };

const MANTENCION_FORM_INICIAL = {
  configuracionIds: [] as string[],
  kilometrajeActual: '',
  kilometrajeProxima: '',
  fechaMantencion: '',
};

const NUEVA_CONFIG_INICIAL = { tipo: '', cadaKm: '' };

const ARRIENDO_FORM_INICIAL = {
  arrendatarioId: '',
  kilometrajeEntrega: '',
  kilometrajeRecepcion: '',
  estado: 'ACTIVO' as EstadoArriendo,
};

type Panel = 'mantenciones' | 'arrendatario';

export function AutosListPage() {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionMantencion[]>([]);

  const [expanded, setExpanded] = useState<{ autoId: string; panel: Panel } | null>(null);

  const [mantenciones, setMantenciones] = useState<MantencionAuto[]>([]);
  const [mantencionForm, setMantencionForm] = useState(MANTENCION_FORM_INICIAL);
  const [mantencionError, setMantencionError] = useState<string | null>(null);
  const [editingMantencionId, setEditingMantencionId] = useState<string | null>(null);
  const [showNuevaConfig, setShowNuevaConfig] = useState(false);
  const [nuevaConfigForm, setNuevaConfigForm] = useState(NUEVA_CONFIG_INICIAL);

  const [arriendosAuto, setArriendosAuto] = useState<ArriendoAuto[]>([]);
  const [arriendoForm, setArriendoForm] = useState(ARRIENDO_FORM_INICIAL);
  const [arriendoError, setArriendoError] = useState<string | null>(null);
  const [editingArriendoId, setEditingArriendoId] = useState<string | null>(null);

  const cargar = () => {
    setLoading(true);
    api
      .get<Auto[]>('/autos')
      .then(setAutos)
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);
  useEffect(() => {
    api.get<Persona[]>('/personas').then(setPersonas);
    api.get<ConfiguracionMantencion[]>('/configuraciones-mantencion').then(setConfiguraciones);
  }, []);

  const cerrarForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(FORM_INICIAL);
    setError(null);
  };

  const abrirCreacion = () => {
    setForm(FORM_INICIAL);
    setEditingId(null);
    setShowForm(true);
  };

  const abrirEdicion = (auto: Auto) => {
    setForm({ patente: auto.patente, kilometraje: String(auto.kilometraje) });
    setEditingId(auto.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        patente: form.patente.toUpperCase(),
        kilometraje: Number(form.kilometraje),
      };

      if (editingId) {
        await api.patch(`/autos/${editingId}`, payload);
      } else {
        await api.post('/autos', payload);
      }

      cerrarForm();
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el auto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este auto?')) return;
    await api.delete(`/autos/${id}`);
    cargar();
  };

  const cambiarEstadoAuto = async (id: string, estado: string) => {
    await api.patch(`/autos/${id}`, { estado });
    cargar();
  };

  // --- Mantenciones ---

  const cerrarPanel = () => {
    setExpanded(null);
  };

  const toggleMantenciones = async (autoId: string) => {
    if (expanded?.autoId === autoId && expanded.panel === 'mantenciones') {
      cerrarPanel();
      return;
    }
    setExpanded({ autoId, panel: 'mantenciones' });
    setEditingMantencionId(null);
    setMantencionForm(MANTENCION_FORM_INICIAL);
    setMantencionError(null);
    setShowNuevaConfig(false);
    const lista = await api.get<MantencionAuto[]>(`/autos/${autoId}/mantenciones`);
    setMantenciones(lista);
  };

  const abrirEdicionMantencion = (mantencion: MantencionAuto) => {
    setEditingMantencionId(mantencion.id);
    setMantencionError(null);
    setMantencionForm({
      configuracionIds: mantencion.items.map((item) => item.configuracionId),
      kilometrajeActual: String(mantencion.kilometrajeActual),
      kilometrajeProxima: mantencion.kilometrajeProxima ? String(mantencion.kilometrajeProxima) : '',
      fechaMantencion: mantencion.fechaMantencion.slice(0, 10),
    });
  };

  const toggleTipoMantencion = (configuracionId: string) => {
    setMantencionForm((prev) => ({
      ...prev,
      configuracionIds: prev.configuracionIds.includes(configuracionId)
        ? prev.configuracionIds.filter((id) => id !== configuracionId)
        : [...prev.configuracionIds, configuracionId],
    }));
  };

  const cancelarEdicionMantencion = () => {
    setEditingMantencionId(null);
    setMantencionForm(MANTENCION_FORM_INICIAL);
    setMantencionError(null);
  };

  const handleCrearConfiguracion = async () => {
    if (!nuevaConfigForm.tipo.trim() || !nuevaConfigForm.cadaKm.trim()) return;
    const nueva = await api.post<ConfiguracionMantencion>('/configuraciones-mantencion', {
      tipo: nuevaConfigForm.tipo,
      cadaKm: Number(nuevaConfigForm.cadaKm),
    });
    const lista = await api.get<ConfiguracionMantencion[]>('/configuraciones-mantencion');
    setConfiguraciones(lista);
    setMantencionForm({ ...mantencionForm, configuracionIds: [...mantencionForm.configuracionIds, nueva.id] });
    setNuevaConfigForm(NUEVA_CONFIG_INICIAL);
    setShowNuevaConfig(false);
  };

  const handleGuardarMantencion = async (autoId: string) => {
    if (
      mantencionForm.configuracionIds.length === 0 ||
      !mantencionForm.kilometrajeActual ||
      !mantencionForm.fechaMantencion
    ) {
      setMantencionError('Elige al menos un tipo de mantención, el km actual y la fecha.');
      return;
    }
    setMantencionError(null);

    const payload = {
      configuracionIds: mantencionForm.configuracionIds,
      kilometrajeActual: Number(mantencionForm.kilometrajeActual),
      kilometrajeProxima: mantencionForm.kilometrajeProxima
        ? Number(mantencionForm.kilometrajeProxima)
        : undefined,
      fechaMantencion: mantencionForm.fechaMantencion,
    };

    if (editingMantencionId) {
      await api.patch(`/autos/${autoId}/mantenciones/${editingMantencionId}`, payload);
    } else {
      await api.post(`/autos/${autoId}/mantenciones`, payload);
    }

    setEditingMantencionId(null);
    setMantencionForm({
      ...MANTENCION_FORM_INICIAL,
      configuracionIds: mantencionForm.configuracionIds,
    });
    const lista = await api.get<MantencionAuto[]>(`/autos/${autoId}/mantenciones`);
    setMantenciones(lista);
  };

  const handleDeleteMantencion = async (autoId: string, id: string) => {
    await api.delete(`/autos/${autoId}/mantenciones/${id}`);
    if (editingMantencionId === id) cancelarEdicionMantencion();
    setMantenciones((prev) => prev.filter((m) => m.id !== id));
  };

  // --- Arrendatario ---

  const toggleArrendatario = async (autoId: string) => {
    if (expanded?.autoId === autoId && expanded.panel === 'arrendatario') {
      cerrarPanel();
      return;
    }
    setExpanded({ autoId, panel: 'arrendatario' });
    setEditingArriendoId(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    setArriendoError(null);
    const lista = await api.get<ArriendoAuto[]>(`/arriendos-auto?autoId=${autoId}`);
    setArriendosAuto(lista);
  };

  const abrirEdicionArriendo = (arriendo: ArriendoAuto) => {
    setEditingArriendoId(arriendo.id);
    setArriendoError(null);
    setArriendoForm({
      arrendatarioId: arriendo.arrendatarioId,
      kilometrajeEntrega: String(arriendo.kilometrajeEntrega),
      kilometrajeRecepcion: arriendo.kilometrajeRecepcion ? String(arriendo.kilometrajeRecepcion) : '',
      estado: arriendo.estado,
    });
  };

  const cancelarEdicionArriendo = () => {
    setEditingArriendoId(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    setArriendoError(null);
  };

  const handleGuardarArriendo = async (autoId: string) => {
    if (!arriendoForm.arrendatarioId || !arriendoForm.kilometrajeEntrega) {
      setArriendoError('Elige el arrendatario y el km de entrega.');
      return;
    }
    setArriendoError(null);

    if (editingArriendoId) {
      await api.patch(`/arriendos-auto/${editingArriendoId}`, {
        arrendatarioId: arriendoForm.arrendatarioId,
        kilometrajeEntrega: Number(arriendoForm.kilometrajeEntrega),
        kilometrajeRecepcion: arriendoForm.kilometrajeRecepcion
          ? Number(arriendoForm.kilometrajeRecepcion)
          : undefined,
        estado: arriendoForm.estado,
      });
    } else {
      await api.post('/arriendos-auto', {
        autoId,
        arrendatarioId: arriendoForm.arrendatarioId,
        kilometrajeEntrega: Number(arriendoForm.kilometrajeEntrega),
      });
    }

    setEditingArriendoId(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    const lista = await api.get<ArriendoAuto[]>(`/arriendos-auto?autoId=${autoId}`);
    setArriendosAuto(lista);
    cargar();
  };

  const handleDeleteArriendo = async (id: string) => {
    await api.delete(`/arriendos-auto/${id}`);
    if (editingArriendoId === id) cancelarEdicionArriendo();
    setArriendosAuto((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Autos</h1>
        <button type="button" onClick={showForm ? cerrarForm : abrirCreacion}>
          {showForm ? 'Cancelar' : '+ Nuevo auto'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Patente
              <input
                required
                value={form.patente}
                onChange={(e) => setForm({ ...form, patente: e.target.value })}
              />
            </label>
            <label>
              Kilometraje
              <input
                type="number"
                min={0}
                required
                value={form.kilometraje}
                onChange={(e) => setForm({ ...form, kilometraje: e.target.value })}
              />
            </label>
          </div>

          {error && <p className="auth-card__error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar auto'}
          </button>
        </form>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && autos.length === 0 && <p className="empty-state">Aún no has agregado autos.</p>}

      {!loading && autos.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Kilometraje</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {autos.map((auto) => (
                <Fragment key={auto.id}>
                  <tr>
                    <td>{auto.patente}</td>
                    <td>{auto.kilometraje.toLocaleString('es-CL')} km</td>
                    <td>
                      <select
                        className={`cell-select badge badge--${auto.estado.toLowerCase()}`}
                        value={auto.estado}
                        onChange={(e) => cambiarEstadoAuto(auto.id, e.target.value)}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {formatEnumLabel(estado)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" onClick={() => abrirEdicion(auto)}>
                          Editar
                        </button>
                        <button type="button" onClick={() => toggleMantenciones(auto.id)}>
                          {expanded?.autoId === auto.id && expanded.panel === 'mantenciones'
                            ? 'Ocultar'
                            : 'Mantenciones'}
                        </button>
                        <button type="button" onClick={() => toggleArrendatario(auto.id)}>
                          {expanded?.autoId === auto.id && expanded.panel === 'arrendatario'
                            ? 'Ocultar'
                            : 'Arrendatario'}
                        </button>
                        <button type="button" className="danger" onClick={() => handleDelete(auto.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded?.autoId === auto.id && expanded.panel === 'mantenciones' && (
                    <tr key={`${auto.id}-mantenciones`}>
                      <td colSpan={4}>
                        <div className="proveedores-panel">
                          {mantenciones.length === 0 && (
                            <p className="empty-state">Sin mantenciones registradas.</p>
                          )}
                          {mantencionError && <p className="auth-card__error">{mantencionError}</p>}
                          {mantenciones.map((m) => (
                            <div key={m.id} className="proveedores-panel__row">
                              <span className="proveedores-panel__tipo">
                                {m.items.map((item) => item.configuracion.tipo).join(', ')}
                              </span>
                              <span>{m.kilometrajeActual.toLocaleString('es-CL')} km actual</span>
                              <span>
                                {m.kilometrajeProxima
                                  ? `próxima ${m.kilometrajeProxima.toLocaleString('es-CL')} km`
                                  : ''}
                              </span>
                              <span>{m.fechaMantencion.slice(0, 10)}</span>
                              <div className="proveedores-panel__row-actions">
                                <button type="button" className="small" onClick={() => abrirEdicionMantencion(m)}>
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="danger danger--small"
                                  onClick={() => handleDeleteMantencion(auto.id, m.id)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="tipo-mantencion-checks">
                            {configuraciones.map((c) => (
                              <label key={c.id} className="checkbox">
                                <input
                                  type="checkbox"
                                  checked={mantencionForm.configuracionIds.includes(c.id)}
                                  onChange={() => toggleTipoMantencion(c.id)}
                                />
                                {c.tipo}
                              </label>
                            ))}
                            <button type="button" onClick={() => setShowNuevaConfig((v) => !v)}>
                              {showNuevaConfig ? 'Cancelar' : '+ Nuevo tipo'}
                            </button>
                          </div>

                          <div className="proveedores-panel__add">
                            <input
                              type="number"
                              placeholder="Km actual"
                              min={0}
                              value={mantencionForm.kilometrajeActual}
                              onChange={(e) =>
                                setMantencionForm({ ...mantencionForm, kilometrajeActual: e.target.value })
                              }
                            />
                            <input
                              type="number"
                              placeholder="Próxima km (opcional)"
                              min={0}
                              value={mantencionForm.kilometrajeProxima}
                              onChange={(e) =>
                                setMantencionForm({ ...mantencionForm, kilometrajeProxima: e.target.value })
                              }
                            />
                            <input
                              type="date"
                              value={mantencionForm.fechaMantencion}
                              onChange={(e) =>
                                setMantencionForm({ ...mantencionForm, fechaMantencion: e.target.value })
                              }
                            />
                            <button type="button" onClick={() => handleGuardarMantencion(auto.id)}>
                              {editingMantencionId ? 'Guardar cambios' : 'Agregar'}
                            </button>
                            {editingMantencionId && (
                              <button type="button" onClick={cancelarEdicionMantencion}>
                                Cancelar
                              </button>
                            )}
                          </div>

                          {showNuevaConfig && (
                            <div className="proveedores-panel__add">
                              <input
                                placeholder="Nombre (ej. Cambio de aceite)"
                                value={nuevaConfigForm.tipo}
                                onChange={(e) =>
                                  setNuevaConfigForm({ ...nuevaConfigForm, tipo: e.target.value })
                                }
                              />
                              <input
                                type="number"
                                placeholder="Cada cuántos km"
                                min={1}
                                value={nuevaConfigForm.cadaKm}
                                onChange={(e) =>
                                  setNuevaConfigForm({ ...nuevaConfigForm, cadaKm: e.target.value })
                                }
                              />
                              <button type="button" onClick={handleCrearConfiguracion}>
                                Crear tipo
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {expanded?.autoId === auto.id && expanded.panel === 'arrendatario' && (
                    <tr key={`${auto.id}-arrendatario`}>
                      <td colSpan={4}>
                        <div className="proveedores-panel">
                          {arriendosAuto.length === 0 && (
                            <p className="empty-state">Sin arrendatario registrado.</p>
                          )}
                          {arriendoError && <p className="auth-card__error">{arriendoError}</p>}
                          {arriendosAuto.map((a) => (
                            <div key={a.id} className="proveedores-panel__row">
                              <span className="proveedores-panel__tipo">{a.arrendatario.nombreCompleto}</span>
                              <span>{a.kilometrajeEntrega.toLocaleString('es-CL')} km entrega</span>
                              <span>
                                {a.kilometrajeRecepcion
                                  ? `${a.kilometrajeRecepcion.toLocaleString('es-CL')} km recepción`
                                  : ''}
                              </span>
                              <span className={`badge badge--${a.estado.toLowerCase()}`}>{a.estado}</span>
                              <div className="proveedores-panel__row-actions">
                                <button type="button" className="small" onClick={() => abrirEdicionArriendo(a)}>
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="danger danger--small"
                                  onClick={() => handleDeleteArriendo(a.id)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="proveedores-panel__add">
                            <select
                              value={arriendoForm.arrendatarioId}
                              onChange={(e) =>
                                setArriendoForm({ ...arriendoForm, arrendatarioId: e.target.value })
                              }
                            >
                              <option value="">Arrendatario…</option>
                              {personas.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nombreCompleto} ({p.rut})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Km entrega"
                              min={0}
                              value={arriendoForm.kilometrajeEntrega}
                              onChange={(e) =>
                                setArriendoForm({ ...arriendoForm, kilometrajeEntrega: e.target.value })
                              }
                            />
                            {editingArriendoId && (
                              <>
                                <input
                                  type="number"
                                  placeholder="Km recepción"
                                  min={0}
                                  value={arriendoForm.kilometrajeRecepcion}
                                  onChange={(e) =>
                                    setArriendoForm({
                                      ...arriendoForm,
                                      kilometrajeRecepcion: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  value={arriendoForm.estado}
                                  onChange={(e) =>
                                    setArriendoForm({
                                      ...arriendoForm,
                                      estado: e.target.value as EstadoArriendo,
                                    })
                                  }
                                >
                                  {ESTADOS_ARRIENDO.map((estado) => (
                                    <option key={estado} value={estado}>
                                      {estado}
                                    </option>
                                  ))}
                                </select>
                              </>
                            )}
                            <button type="button" onClick={() => handleGuardarArriendo(auto.id)}>
                              {editingArriendoId ? 'Guardar cambios' : 'Agregar'}
                            </button>
                            {editingArriendoId && (
                              <button type="button" onClick={cancelarEdicionArriendo}>
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
