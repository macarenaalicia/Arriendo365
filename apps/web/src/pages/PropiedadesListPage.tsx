import { Fragment, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import { EMPRESAS_POR_TIPO_PROVEEDOR } from '../api/types';
import type { EstadoProveedor, Propiedad, Proveedor, TipoProveedor } from '../api/types';

const TIPOS = ['CASA', 'DEPARTAMENTO', 'HABITACION', 'TERRENO'] as const;
const ESTADOS_PROPIEDAD = ['DISPONIBLE', 'ARRENDADA', 'EN_MANTENCION', 'USUFRUCTO'] as const;

type CampoOrdenable =
  | 'rol'
  | 'direccion'
  | 'ubicacion'
  | 'tipo'
  | 'nHabitaciones'
  | 'nBanos'
  | 'mt2Totales'
  | 'estado';

type CampoCelda = 'rol' | 'nHabitaciones' | 'nBanos' | 'mt2Totales';

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
  aguaEmpresa: EMPRESAS_POR_TIPO_PROVEEDOR.AGUA[0],
  aguaCliente: '',
  luzEmpresa: EMPRESAS_POR_TIPO_PROVEEDOR.LUZ[0],
  luzCliente: '',
  gasEmpresa: EMPRESAS_POR_TIPO_PROVEEDOR.GAS[0],
  gasCliente: '',
};

const PROVEEDOR_LABELS: Record<TipoProveedor, string> = {
  AGUA: 'Agua',
  LUZ: 'Luz',
  GAS: 'Gas',
};

const PROVEEDOR_FORM_INICIAL = {
  tipo: 'AGUA' as TipoProveedor,
  empresa: EMPRESAS_POR_TIPO_PROVEEDOR.AGUA[0],
  nCliente: '',
  estado: 'ACTIVO' as EstadoProveedor,
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
  const [proveedorForm, setProveedorForm] = useState(PROVEEDOR_FORM_INICIAL);
  const [editingProveedorId, setEditingProveedorId] = useState<string | null>(null);

  const [sortField, setSortField] = useState<CampoOrdenable | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [editingCell, setEditingCell] = useState<{ id: string; campo: CampoCelda } | null>(null);
  const [cellValue, setCellValue] = useState('');

  const toggleSort = (campo: CampoOrdenable) => {
    if (sortField === campo) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(campo);
      setSortDir('asc');
    }
  };

  const valorOrdenable = (propiedad: Propiedad, campo: CampoOrdenable): string | number => {
    switch (campo) {
      case 'rol':
        return propiedad.rol;
      case 'direccion':
        return `${propiedad.calle} ${propiedad.numero}`;
      case 'ubicacion':
        return `${propiedad.ciudad} ${propiedad.region}`;
      case 'tipo':
        return propiedad.tipo;
      case 'nHabitaciones':
        return propiedad.nHabitaciones;
      case 'nBanos':
        return propiedad.nBanos;
      case 'mt2Totales':
        return Number(propiedad.mt2Totales);
      case 'estado':
        return propiedad.estado;
    }
  };

  const propiedadesOrdenadas = useMemo(() => {
    if (!sortField) return propiedades;
    const copia = [...propiedades];
    copia.sort((a, b) => {
      const va = valorOrdenable(a, sortField);
      const vb = valorOrdenable(b, sortField);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copia;
  }, [propiedades, sortField, sortDir]);

  const guardarCampo = async (id: string, campo: string, valor: unknown) => {
    await api.patch(`/propiedades/${id}`, { [campo]: valor });
    cargar();
  };

  const startEditCell = (propiedad: Propiedad, campo: CampoCelda) => {
    setEditingCell({ id: propiedad.id, campo });
    setCellValue(String(propiedad[campo]));
  };

  const commitCellEdit = async (propiedad: Propiedad) => {
    if (!editingCell || editingCell.id !== propiedad.id) return;
    const campo = editingCell.campo;
    setEditingCell(null);

    const valorActual = String(propiedad[campo]);
    const raw = cellValue.trim();
    if (raw === '' || raw === valorActual) return;

    const valor = campo === 'rol' ? raw : Number(raw);
    if (campo !== 'rol' && Number.isNaN(valor as number)) return;

    await guardarCampo(propiedad.id, campo, valor);
  };

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

        const candidatos: Array<{ tipo: TipoProveedor; empresa: string; nCliente: string }> = [
          { tipo: 'AGUA', empresa: form.aguaEmpresa, nCliente: form.aguaCliente },
          { tipo: 'LUZ', empresa: form.luzEmpresa, nCliente: form.luzCliente },
          { tipo: 'GAS', empresa: form.gasEmpresa, nCliente: form.gasCliente },
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
    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
    const lista = await api.get<Proveedor[]>(`/propiedades/${propiedadId}/proveedores`);
    setProveedores(lista);
  };

  const abrirEdicionProveedor = (proveedor: Proveedor) => {
    setEditingProveedorId(proveedor.id);
    setProveedorForm({
      tipo: proveedor.tipo,
      empresa: proveedor.empresa,
      nCliente: proveedor.nCliente,
      estado: proveedor.estado,
    });
  };

  const cancelarEdicionProveedor = () => {
    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
  };

  const handleGuardarProveedor = async (propiedadId: string) => {
    if (!proveedorForm.nCliente.trim()) return;

    if (editingProveedorId) {
      await api.patch(`/propiedades/${propiedadId}/proveedores/${editingProveedorId}`, proveedorForm);
    } else {
      await api.post(`/propiedades/${propiedadId}/proveedores`, proveedorForm);
    }

    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
    const lista = await api.get<Proveedor[]>(`/propiedades/${propiedadId}/proveedores`);
    setProveedores(lista);
  };

  const handleDeleteProveedor = async (propiedadId: string, proveedorId: string) => {
    await api.delete(`/propiedades/${propiedadId}/proveedores/${proveedorId}`);
    if (editingProveedorId === proveedorId) cancelarEdicionProveedor();
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
                  Empresa agua
                  <select
                    value={form.aguaEmpresa}
                    onChange={(e) => setForm({ ...form, aguaEmpresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR.AGUA.map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  N° cliente agua
                  <input
                    value={form.aguaCliente}
                    onChange={(e) => setForm({ ...form, aguaCliente: e.target.value })}
                  />
                </label>
                <label>
                  Empresa luz
                  <select
                    value={form.luzEmpresa}
                    onChange={(e) => setForm({ ...form, luzEmpresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR.LUZ.map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  N° cliente luz
                  <input
                    value={form.luzCliente}
                    onChange={(e) => setForm({ ...form, luzCliente: e.target.value })}
                  />
                </label>
                <label>
                  Empresa gas
                  <select
                    value={form.gasEmpresa}
                    onChange={(e) => setForm({ ...form, gasEmpresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR.GAS.map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
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

      {!loading && propiedades.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {(
                  [
                    ['rol', 'Rol'],
                    ['direccion', 'Dirección'],
                    ['ubicacion', 'Ubicación'],
                    ['tipo', 'Tipo'],
                    ['nHabitaciones', 'Hab'],
                    ['nBanos', 'Baños'],
                    ['mt2Totales', 'M²'],
                    ['estado', 'Estado'],
                  ] as Array<[CampoOrdenable, string]>
                ).map(([campo, etiqueta]) => (
                  <th key={campo} className="th-sortable" onClick={() => toggleSort(campo)}>
                    {etiqueta}
                    <span className="th-sortable__arrow">
                      {sortField === campo ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </span>
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {propiedadesOrdenadas.map((propiedad) => (
                <Fragment key={propiedad.id}>
                  <tr>
                    <td
                      className="cell-editable"
                      onClick={() => startEditCell(propiedad, 'rol')}
                    >
                      {editingCell?.id === propiedad.id && editingCell.campo === 'rol' ? (
                        <input
                          autoFocus
                          className="cell-input"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => commitCellEdit(propiedad)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                        />
                      ) : (
                        propiedad.rol
                      )}
                    </td>
                    <td>
                      {propiedad.calle} {propiedad.numero}
                      {propiedad.numeroDepartamento ? ` depto ${propiedad.numeroDepartamento}` : ''}
                    </td>
                    <td>
                      {propiedad.ciudad}, {propiedad.region}
                    </td>
                    <td>
                      <select
                        className="cell-select"
                        value={propiedad.tipo}
                        onChange={(e) => guardarCampo(propiedad.id, 'tipo', e.target.value)}
                      >
                        {TIPOS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    {(['nHabitaciones', 'nBanos', 'mt2Totales'] as CampoCelda[]).map((campo) => (
                      <td
                        key={campo}
                        className="cell-editable"
                        onClick={() => startEditCell(propiedad, campo)}
                      >
                        {editingCell?.id === propiedad.id && editingCell.campo === campo ? (
                          <input
                            autoFocus
                            type="number"
                            step={campo === 'mt2Totales' ? '0.01' : '1'}
                            min={0}
                            className="cell-input"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={() => commitCellEdit(propiedad)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                        ) : (
                          propiedad[campo]
                        )}
                      </td>
                    ))}
                    <td>
                      <select
                        className={`cell-select badge badge--${propiedad.estado.toLowerCase()}`}
                        value={propiedad.estado}
                        onChange={(e) => guardarCampo(propiedad.id, 'estado', e.target.value)}
                      >
                        {ESTADOS_PROPIEDAD.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" onClick={() => abrirEdicion(propiedad)}>
                          Editar
                        </button>
                        <button type="button" onClick={() => toggleProveedores(propiedad.id)}>
                          {expandedId === propiedad.id ? 'Ocultar' : 'Proveedores'}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(propiedad.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === propiedad.id && (
                    <tr>
                      <td colSpan={9}>
                        <div className="proveedores-panel">
                          {proveedores.length === 0 && (
                            <p className="empty-state">Sin cuentas de proveedores registradas.</p>
                          )}
                          {proveedores.map((proveedor) => (
                            <div key={proveedor.id} className="proveedores-panel__row">
                              <span className="proveedores-panel__tipo">
                                {PROVEEDOR_LABELS[proveedor.tipo]}
                              </span>
                              <span>{proveedor.empresa}</span>
                              <span>{proveedor.nCliente}</span>
                              <span className={`badge badge--${proveedor.estado.toLowerCase()}`}>
                                {proveedor.estado}
                              </span>
                              <div className="proveedores-panel__row-actions">
                                <button
                                  type="button"
                                  className="small"
                                  onClick={() => abrirEdicionProveedor(proveedor)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="danger danger--small"
                                  onClick={() => handleDeleteProveedor(propiedad.id, proveedor.id)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="proveedores-panel__add">
                            <select
                              value={proveedorForm.tipo}
                              onChange={(e) => {
                                const tipo = e.target.value as TipoProveedor;
                                setProveedorForm({
                                  ...proveedorForm,
                                  tipo,
                                  empresa: EMPRESAS_POR_TIPO_PROVEEDOR[tipo][0],
                                });
                              }}
                            >
                              {(Object.keys(PROVEEDOR_LABELS) as TipoProveedor[]).map((tipo) => (
                                <option key={tipo} value={tipo}>
                                  {PROVEEDOR_LABELS[tipo]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={proveedorForm.empresa}
                              onChange={(e) =>
                                setProveedorForm({ ...proveedorForm, empresa: e.target.value })
                              }
                            >
                              {EMPRESAS_POR_TIPO_PROVEEDOR[proveedorForm.tipo].map((empresa) => (
                                <option key={empresa} value={empresa}>
                                  {empresa}
                                </option>
                              ))}
                            </select>
                            <input
                              placeholder="N° cliente"
                              value={proveedorForm.nCliente}
                              onChange={(e) =>
                                setProveedorForm({ ...proveedorForm, nCliente: e.target.value })
                              }
                            />
                            {editingProveedorId && (
                              <select
                                value={proveedorForm.estado}
                                onChange={(e) =>
                                  setProveedorForm({
                                    ...proveedorForm,
                                    estado: e.target.value as EstadoProveedor,
                                  })
                                }
                              >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="INACTIVO">INACTIVO</option>
                              </select>
                            )}
                            <button type="button" onClick={() => handleGuardarProveedor(propiedad.id)}>
                              {editingProveedorId ? 'Guardar cambios' : 'Agregar'}
                            </button>
                            {editingProveedorId && (
                              <button type="button" onClick={cancelarEdicionProveedor}>
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
