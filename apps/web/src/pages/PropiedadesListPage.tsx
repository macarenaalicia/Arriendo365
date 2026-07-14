import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Propiedad, Proveedor, TipoProveedor } from '../api/types';

const TIPOS = ['CASA', 'DEPARTAMENTO', 'HABITACION'] as const;

const FORM_INICIAL = {
  rol: '',
  calle: '',
  numero: '',
  numeroDepartamento: '',
  sector: '',
  ciudad: '',
  region: '',
  tipo: 'CASA' as (typeof TIPOS)[number],
  nHabitaciones: '',
  nBanos: '',
  mt2Totales: '',
  mt2Construidos: '',
  bodega: false,
  estacionamiento: false,
  pagaContribuciones: false,
  descripcion: '',
  aguaCliente: '',
  luzCliente: '',
  gasCliente: '',
};

const PROVEEDOR_LABELS: Record<TipoProveedor, string> = {
  AGUA: 'Agua',
  LUZ: 'Luz',
  GAS: 'Gas',
};

export function PropiedadesListPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorForm, setProveedorForm] = useState({ tipo: 'AGUA' as TipoProveedor, nCliente: '' });

  const cargar = () => {
    setLoading(true);
    api
      .get<Propiedad[]>('/propiedades')
      .then(setPropiedades)
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

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

  const abrirEdicion = (propiedad: Propiedad) => {
    setForm({
      ...FORM_INICIAL,
      rol: propiedad.rol,
      calle: propiedad.calle,
      numero: propiedad.numero,
      numeroDepartamento: propiedad.numeroDepartamento ?? '',
      sector: propiedad.sector ?? '',
      ciudad: propiedad.ciudad,
      region: propiedad.region,
      tipo: propiedad.tipo,
      nHabitaciones: String(propiedad.nHabitaciones),
      nBanos: String(propiedad.nBanos),
      mt2Totales: propiedad.mt2Totales,
      mt2Construidos: propiedad.mt2Construidos,
      bodega: propiedad.bodega,
      estacionamiento: propiedad.estacionamiento,
      pagaContribuciones: propiedad.pagaContribuciones,
      descripcion: propiedad.descripcion ?? '',
    });
    setEditingId(propiedad.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        rol: form.rol,
        calle: form.calle,
        numero: form.numero,
        numeroDepartamento:
          form.tipo === 'DEPARTAMENTO' && form.numeroDepartamento ? form.numeroDepartamento : undefined,
        sector: form.sector || undefined,
        ciudad: form.ciudad,
        region: form.region,
        tipo: form.tipo,
        nHabitaciones: Number(form.nHabitaciones),
        nBanos: Number(form.nBanos),
        mt2Totales: Number(form.mt2Totales),
        mt2Construidos: Number(form.mt2Construidos),
        bodega: form.bodega,
        estacionamiento: form.estacionamiento,
        pagaContribuciones: form.pagaContribuciones,
        descripcion: form.descripcion || undefined,
      };

      if (editingId) {
        await api.patch(`/propiedades/${editingId}`, payload);
      } else {
        const creada = await api.post<Propiedad>('/propiedades', payload);

        const candidatos: Array<{ tipo: TipoProveedor; nCliente: string }> = [
          { tipo: 'AGUA', nCliente: form.aguaCliente },
          { tipo: 'LUZ', nCliente: form.luzCliente },
          { tipo: 'GAS', nCliente: form.gasCliente },
        ];
        const proveedoresIniciales = candidatos.filter((p) => p.nCliente.trim() !== '');

        for (const proveedor of proveedoresIniciales) {
          await api.post(`/propiedades/${creada.id}/proveedores`, proveedor);
        }
      }

      cerrarForm();
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la propiedad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta propiedad?')) return;
    await api.delete(`/propiedades/${id}`);
    if (expandedId === id) setExpandedId(null);
    cargar();
  };

  const toggleProveedores = async (propiedadId: string) => {
    if (expandedId === propiedadId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(propiedadId);
    setProveedorForm({ tipo: 'AGUA', nCliente: '' });
    const lista = await api.get<Proveedor[]>(`/propiedades/${propiedadId}/proveedores`);
    setProveedores(lista);
  };

  const handleAddProveedor = async (propiedadId: string) => {
    if (!proveedorForm.nCliente.trim()) return;
    await api.post(`/propiedades/${propiedadId}/proveedores`, proveedorForm);
    setProveedorForm({ tipo: 'AGUA', nCliente: '' });
    const lista = await api.get<Proveedor[]>(`/propiedades/${propiedadId}/proveedores`);
    setProveedores(lista);
  };

  const handleDeleteProveedor = async (propiedadId: string, proveedorId: string) => {
    await api.delete(`/propiedades/${propiedadId}/proveedores/${proveedorId}`);
    setProveedores((prev) => prev.filter((p) => p.id !== proveedorId));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Propiedades</h1>
        <button type="button" onClick={showForm ? cerrarForm : abrirCreacion}>
          {showForm ? 'Cancelar' : '+ Nueva propiedad'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Rol de avalúo
              <input
                required
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              />
            </label>
            <label>
              Tipo
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Calle
              <input
                required
                value={form.calle}
                onChange={(e) => setForm({ ...form, calle: e.target.value })}
              />
            </label>
            <label>
              Número
              <input
                required
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </label>
            {form.tipo === 'DEPARTAMENTO' && (
              <label>
                Número de departamento
                <input
                  value={form.numeroDepartamento}
                  onChange={(e) => setForm({ ...form, numeroDepartamento: e.target.value })}
                />
              </label>
            )}
            <label>
              Sector
              <input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </label>
            <label>
              Ciudad
              <input
                required
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              />
            </label>
            <label>
              Región
              <input
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </label>
            <label>
              Habitaciones
              <input
                type="number"
                min={0}
                required
                value={form.nHabitaciones}
                onChange={(e) => setForm({ ...form, nHabitaciones: e.target.value })}
              />
            </label>
            <label>
              Baños
              <input
                type="number"
                min={0}
                required
                value={form.nBanos}
                onChange={(e) => setForm({ ...form, nBanos: e.target.value })}
              />
            </label>
            <label>
              M² totales
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.mt2Totales}
                onChange={(e) => setForm({ ...form, mt2Totales: e.target.value })}
              />
            </label>
            <label>
              M² construidos
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.mt2Construidos}
                onChange={(e) => setForm({ ...form, mt2Construidos: e.target.value })}
              />
            </label>
          </div>

          <div className="inline-form__checks">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.bodega}
                onChange={(e) => setForm({ ...form, bodega: e.target.checked })}
              />
              Bodega
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.estacionamiento}
                onChange={(e) => setForm({ ...form, estacionamiento: e.target.checked })}
              />
              Estacionamiento
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.pagaContribuciones}
                onChange={(e) => setForm({ ...form, pagaContribuciones: e.target.checked })}
              />
              Paga contribuciones
            </label>
          </div>

          <label>
            Descripción
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>

          {!editingId && (
            <fieldset className="inline-form__fieldset">
              <legend>Cuentas de proveedores (opcional)</legend>
              <div className="inline-form__grid">
                <label>
                  N° cliente agua
                  <input
                    value={form.aguaCliente}
                    onChange={(e) => setForm({ ...form, aguaCliente: e.target.value })}
                  />
                </label>
                <label>
                  N° cliente luz
                  <input
                    value={form.luzCliente}
                    onChange={(e) => setForm({ ...form, luzCliente: e.target.value })}
                  />
                </label>
                <label>
                  N° cliente gas
                  <input
                    value={form.gasCliente}
                    onChange={(e) => setForm({ ...form, gasCliente: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {error && <p className="auth-card__error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar propiedad'}
          </button>
        </form>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && propiedades.length === 0 && (
        <p className="empty-state">Aún no has agregado propiedades.</p>
      )}

      <div className="card-list">
        {propiedades.map((propiedad) => (
          <div key={propiedad.id} className="card card--static">
            <div className="card__title">
              {propiedad.calle} {propiedad.numero}
              {propiedad.numeroDepartamento ? ` depto ${propiedad.numeroDepartamento}` : ''}
            </div>
            <div className="card__subtitle">
              {propiedad.ciudad}, {propiedad.region}
            </div>
            <div className="card__row">
              <span className={`badge badge--${propiedad.estado.toLowerCase()}`}>
                {propiedad.estado}
              </span>
              <span>{propiedad.tipo}</span>
              <span>
                {propiedad.nHabitaciones} hab · {propiedad.nBanos} baños
              </span>
            </div>

            <div className="card__actions">
              <button type="button" onClick={() => abrirEdicion(propiedad)}>
                Editar
              </button>
              <button type="button" onClick={() => toggleProveedores(propiedad.id)}>
                {expandedId === propiedad.id ? 'Ocultar proveedores' : 'Proveedores'}
              </button>
              <button type="button" className="danger" onClick={() => handleDelete(propiedad.id)}>
                Eliminar
              </button>
            </div>

            {expandedId === propiedad.id && (
              <div className="proveedores-panel">
                {proveedores.length === 0 && (
                  <p className="empty-state">Sin cuentas de proveedores registradas.</p>
                )}
                {proveedores.map((proveedor) => (
                  <div key={proveedor.id} className="proveedores-panel__row">
                    <span className="proveedores-panel__tipo">
                      {PROVEEDOR_LABELS[proveedor.tipo]}
                    </span>
                    <span>{proveedor.nCliente}</span>
                    <span className={`badge badge--${proveedor.estado.toLowerCase()}`}>
                      {proveedor.estado}
                    </span>
                    <button
                      type="button"
                      className="danger danger--small"
                      onClick={() => handleDeleteProveedor(propiedad.id, proveedor.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}

                <div className="proveedores-panel__add">
                  <select
                    value={proveedorForm.tipo}
                    onChange={(e) =>
                      setProveedorForm({ ...proveedorForm, tipo: e.target.value as TipoProveedor })
                    }
                  >
                    {(Object.keys(PROVEEDOR_LABELS) as TipoProveedor[]).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {PROVEEDOR_LABELS[tipo]}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="N° cliente"
                    value={proveedorForm.nCliente}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, nCliente: e.target.value })}
                  />
                  <button type="button" onClick={() => handleAddProveedor(propiedad.id)}>
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
