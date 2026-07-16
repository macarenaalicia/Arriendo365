import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { ddmmyyyyToIso, formatEnumLabel, formatFecha, formatMonto, isoToDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { IconCheck, IconEditar, IconEliminar, IconReloj } from '../components/icons';
import { MEDIOS_PAGO } from '../lib/periodos';

const ESTADOS: EstadoAuto[] = ['DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION'];
const ESTADOS_ARRIENDO: EstadoArriendo[] = ['ACTIVO', 'INACTIVO', 'TERMINADO'];

const FORM_INICIAL = { patente: '', kilometraje: '' };

const MANTENCION_FORM_INICIAL = {
  configuracionIds: [] as string[],
  kilometrajeActual: '',
  kilometrajeProxima: '',
  fechaMantencion: '',
  costo: '',
  medioPago: '',
};

const NUEVA_CONFIG_INICIAL = { tipo: '', cadaKm: '' };

const ARRIENDO_FORM_INICIAL = {
  arrendatarioId: '',
  kilometrajeEntrega: '',
  kilometrajeRecepcion: '',
  estado: 'ACTIVO' as EstadoArriendo,
};

export function AutoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [auto, setAuto] = useState<Auto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionMantencion[]>([]);

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

  const cargarAuto = () => {
    if (!id) return;
    setLoading(true);
    api
      .get<Auto>(`/autos/${id}`)
      .then(setAuto)
      .catch(() => setError('No se pudo cargar el auto'))
      .finally(() => setLoading(false));
  };

  const cargarMantenciones = () => {
    if (!id) return;
    api.get<MantencionAuto[]>(`/autos/${id}/mantenciones`).then(setMantenciones);
  };

  const cargarArriendos = () => {
    if (!id) return;
    api.get<ArriendoAuto[]>(`/arriendos-auto?autoId=${id}`).then(setArriendosAuto);
  };

  useEffect(cargarAuto, [id]);
  useEffect(cargarMantenciones, [id]);
  useEffect(cargarArriendos, [id]);
  useEffect(() => {
    api.get<Persona[]>('/personas').then(setPersonas);
    api.get<ConfiguracionMantencion[]>('/configuraciones-mantencion').then(setConfiguraciones);
  }, []);

  const cerrarForm = () => {
    setShowForm(false);
    setFormError(null);
  };

  const abrirEdicion = () => {
    if (!auto) return;
    setForm({ patente: auto.patente, kilometraje: String(auto.kilometraje) });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setFormError(null);
    setSaving(true);
    try {
      await api.patch(`/autos/${id}`, {
        patente: form.patente.toUpperCase(),
        kilometraje: Number(form.kilometraje),
      });
      cerrarForm();
      cargarAuto();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el auto');
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstadoAuto = async (estado: string) => {
    if (!id) return;
    await api.patch(`/autos/${id}`, { estado });
    cargarAuto();
  };

  // --- Mantenciones ---

  const abrirEdicionMantencion = (mantencion: MantencionAuto) => {
    setEditingMantencionId(mantencion.id);
    setMantencionError(null);
    setMantencionForm({
      configuracionIds: mantencion.items.map((item) => item.configuracionId),
      kilometrajeActual: String(mantencion.kilometrajeActual),
      kilometrajeProxima: mantencion.kilometrajeProxima ? String(mantencion.kilometrajeProxima) : '',
      fechaMantencion: isoToDdmmyyyy(mantencion.fechaMantencion),
      costo: mantencion.costo ?? '',
      medioPago: mantencion.medioPago ?? '',
    });
  };

  const toggleTipoMantencion = (configuracionId: string) => {
    setMantencionForm((prev) => ({
      ...prev,
      configuracionIds: prev.configuracionIds.includes(configuracionId)
        ? prev.configuracionIds.filter((cid) => cid !== configuracionId)
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

  const handleGuardarMantencion = async () => {
    if (!id) return;
    if (
      mantencionForm.configuracionIds.length === 0 ||
      !mantencionForm.kilometrajeActual ||
      !mantencionForm.fechaMantencion
    ) {
      setMantencionError('Elige al menos un tipo de mantención, el km actual y la fecha.');
      return;
    }

    const fechaMantencion = ddmmyyyyToIso(mantencionForm.fechaMantencion);
    if (!fechaMantencion) {
      setMantencionError('Fecha inválida, usa el formato dd/mm/aaaa.');
      return;
    }
    setMantencionError(null);

    const payload = {
      configuracionIds: mantencionForm.configuracionIds,
      kilometrajeActual: Number(mantencionForm.kilometrajeActual),
      kilometrajeProxima: mantencionForm.kilometrajeProxima
        ? Number(mantencionForm.kilometrajeProxima)
        : undefined,
      fechaMantencion,
      costo: mantencionForm.costo ? Number(mantencionForm.costo) : undefined,
      medioPago: mantencionForm.medioPago || undefined,
    };

    if (editingMantencionId) {
      await api.patch(`/autos/${id}/mantenciones/${editingMantencionId}`, payload);
    } else {
      await api.post(`/autos/${id}/mantenciones`, payload);
    }

    setEditingMantencionId(null);
    setMantencionForm({ ...MANTENCION_FORM_INICIAL, configuracionIds: mantencionForm.configuracionIds });
    cargarMantenciones();
  };

  const handleDeleteMantencion = async (mantencionId: string) => {
    if (!id) return;
    await api.delete(`/autos/${id}/mantenciones/${mantencionId}`);
    if (editingMantencionId === mantencionId) cancelarEdicionMantencion();
    setMantenciones((prev) => prev.filter((m) => m.id !== mantencionId));
  };

  const handleAprobarMantencion = async (mantencionId: string) => {
    if (!id) return;
    await api.patch(`/autos/${id}/mantenciones/${mantencionId}`, {
      aprobado: true,
      estadoPago: 'PAGADO',
    });
    cargarMantenciones();
  };

  const handleRechazarMantencion = async (mantencionId: string) => {
    if (!id) return;
    const motivoRechazo = prompt('Motivo del rechazo:');
    if (motivoRechazo === null) return;
    if (!motivoRechazo.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }
    await api.patch(`/autos/${id}/mantenciones/${mantencionId}`, {
      aprobado: false,
      estadoPago: 'RECHAZADO',
      motivoRechazo: motivoRechazo.trim(),
    });
    cargarMantenciones();
  };

  // --- Arrendatario ---

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

  const handleGuardarArriendo = async () => {
    if (!id) return;
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
        autoId: id,
        arrendatarioId: arriendoForm.arrendatarioId,
        kilometrajeEntrega: Number(arriendoForm.kilometrajeEntrega),
      });
    }

    setEditingArriendoId(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    cargarArriendos();
    cargarAuto();
  };

  const handleDeleteArriendo = async (arriendoId: string) => {
    await api.delete(`/arriendos-auto/${arriendoId}`);
    if (editingArriendoId === arriendoId) cancelarEdicionArriendo();
    setArriendosAuto((prev) => prev.filter((a) => a.id !== arriendoId));
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!auto) return null;

  return (
    <div>
      <Link to="/autos" className="back-link">
        ← Volver a autos
      </Link>

      <div className="page-header">
        <h1>{auto.patente}</h1>
        <select
          className={`cell-select badge badge--${auto.estado.toLowerCase()}`}
          value={auto.estado}
          onChange={(e) => cambiarEstadoAuto(e.target.value)}
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {formatEnumLabel(estado)}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <Modal titulo="Editar auto" onClose={cerrarForm}>
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

            {formError && <p className="auth-card__error">{formError}</p>}

            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </Modal>
      )}

      <div className="detail-grid">
        <div className="detail-card">
          <h2>Información</h2>
          <p>Kilometraje: {auto.kilometraje.toLocaleString('es-CL')} km</p>
          <button type="button" className="link-button" onClick={abrirEdicion}>
            Editar auto
          </button>
        </div>
      </div>

      <section>
        <div className="page-header">
          <h2>Arrendatario</h2>
        </div>

        {arriendosAuto.length === 0 && (
          <p className="empty-state">Sin arrendatario registrado.</p>
        )}
        {arriendoError && <p className="auth-card__error">{arriendoError}</p>}

        {arriendosAuto.length > 0 && (
          <div className="proveedores-panel__grid">
            {arriendosAuto.map((a) => (
              <div key={a.id} className="proveedores-panel__row">
                <span className="proveedores-panel__tipo">{a.arrendatario.nombreCompleto}</span>
                <span>Kilometraje entrega: {a.kilometrajeEntrega.toLocaleString('es-CL')} km</span>
                {a.kilometrajeRecepcion && (
                  <span>Kilometraje recepción: {a.kilometrajeRecepcion.toLocaleString('es-CL')} km</span>
                )}
                <span>
                  Estado: <span className={`badge badge--${a.estado.toLowerCase()}`}>{a.estado}</span>
                </span>
                <div className="proveedores-panel__row-actions">
                  <button
                    type="button"
                    className="icon-button icon-button--small"
                    title="Editar"
                    aria-label="Editar"
                    onClick={() => abrirEdicionArriendo(a)}
                  >
                    <IconEditar />
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button--small icon-button--danger"
                    title="Eliminar"
                    aria-label="Eliminar"
                    onClick={() => handleDeleteArriendo(a.id)}
                  >
                    <IconEliminar />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="proveedores-panel__add">
          <select
            value={arriendoForm.arrendatarioId}
            onChange={(e) => setArriendoForm({ ...arriendoForm, arrendatarioId: e.target.value })}
          >
            <option value="">Arrendatario…</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombreCompleto}
                {p.rut ? ` (${p.rut})` : ''}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Km entrega"
            min={0}
            value={arriendoForm.kilometrajeEntrega}
            onChange={(e) => setArriendoForm({ ...arriendoForm, kilometrajeEntrega: e.target.value })}
          />
          {editingArriendoId && (
            <>
              <input
                type="number"
                placeholder="Km recepción"
                min={0}
                value={arriendoForm.kilometrajeRecepcion}
                onChange={(e) =>
                  setArriendoForm({ ...arriendoForm, kilometrajeRecepcion: e.target.value })
                }
              />
              <select
                value={arriendoForm.estado}
                onChange={(e) =>
                  setArriendoForm({ ...arriendoForm, estado: e.target.value as EstadoArriendo })
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
          <button type="button" onClick={handleGuardarArriendo}>
            {editingArriendoId ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editingArriendoId && (
            <button type="button" onClick={cancelarEdicionArriendo}>
              Cancelar
            </button>
          )}
        </div>
      </section>

      <section>
        <div className="page-header">
          <h2>Mantenciones</h2>
        </div>

        {mantencionError && <p className="auth-card__error">{mantencionError}</p>}
        {mantenciones.length === 0 && <p className="empty-state">Sin mantenciones registradas.</p>}

        {mantenciones.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Kilometraje</th>
                  <th>Próximo km</th>
                  {configuraciones.map((c) => (
                    <th key={c.id}>{c.tipo}</th>
                  ))}
                  <th>Costo</th>
                  <th>Revisión</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenciones.map((m) => (
                  <tr key={m.id}>
                    <td>{formatFecha(m.fechaMantencion)}</td>
                    <td>{m.kilometrajeActual.toLocaleString('es-CL')} km</td>
                    <td>
                      {m.kilometrajeProxima ? `${m.kilometrajeProxima.toLocaleString('es-CL')} km` : '—'}
                    </td>
                    {configuraciones.map((c) => (
                      <td key={c.id} style={{ textAlign: 'center' }}>
                        {m.items.some((item) => item.configuracionId === c.id) ? '✓' : ''}
                      </td>
                    ))}
                    <td>{m.costo ? formatMonto(m.costo) : '—'}</td>
                    <td>
                      {m.aprobado !== null && (
                        <div>
                          <span className="icono-revision icono-revision--aprobado" title="Revisado">
                            <IconCheck />
                          </span>
                          {m.aprobado === false && m.motivoRechazo && (
                            <p className="table__note">{m.motivoRechazo}</p>
                          )}
                        </div>
                      )}
                      {m.aprobado === null && (
                        <div className="table__actions">
                          <span className="icono-revision icono-revision--pendiente" title="Pendiente">
                            <IconReloj />
                          </span>
                          <button type="button" onClick={() => handleAprobarMantencion(m.id)}>
                            Aprobar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleRechazarMantencion(m.id)}
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => abrirEdicionMantencion(m)}
                        >
                          <IconEditar />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => handleDeleteMantencion(m.id)}
                        >
                          <IconEliminar />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <fieldset className="inline-form__fieldset">
          <legend>{editingMantencionId ? 'Editar mantención' : 'Registrar mantención'}</legend>

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
            <button
              type="button"
              className="link-button"
              onClick={() => setShowNuevaConfig((v) => !v)}
            >
              {showNuevaConfig ? 'Cancelar' : '+ Nuevo tipo'}
            </button>
          </div>

          {showNuevaConfig && (
            <div className="proveedores-panel__add">
              <input
                placeholder="Nombre (ej. Cambio de aceite)"
                value={nuevaConfigForm.tipo}
                onChange={(e) => setNuevaConfigForm({ ...nuevaConfigForm, tipo: e.target.value })}
              />
              <input
                type="number"
                placeholder="Cada cuántos km"
                min={1}
                value={nuevaConfigForm.cadaKm}
                onChange={(e) => setNuevaConfigForm({ ...nuevaConfigForm, cadaKm: e.target.value })}
              />
              <button type="button" onClick={handleCrearConfiguracion}>
                Crear tipo
              </button>
            </div>
          )}

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
            <DateInput
              value={mantencionForm.fechaMantencion}
              onChange={(value) => setMantencionForm({ ...mantencionForm, fechaMantencion: value })}
            />
            <input
              type="number"
              placeholder="Costo (opcional)"
              min={0}
              value={mantencionForm.costo}
              onChange={(e) => setMantencionForm({ ...mantencionForm, costo: e.target.value })}
            />
            <select
              value={mantencionForm.medioPago}
              onChange={(e) => setMantencionForm({ ...mantencionForm, medioPago: e.target.value })}
            >
              <option value="">Medio de pago…</option>
              {MEDIOS_PAGO.map((medio) => (
                <option key={medio} value={medio}>
                  {medio}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleGuardarMantencion}>
              {editingMantencionId ? 'Guardar cambios' : 'Agregar'}
            </button>
            {editingMantencionId && (
              <button type="button" onClick={cancelarEdicionMantencion}>
                Cancelar
              </button>
            )}
          </div>
        </fieldset>
      </section>
    </div>
  );
}
