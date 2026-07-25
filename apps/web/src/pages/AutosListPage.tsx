import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Auto, EstadoAuto } from '../api/types';
import { formatEnumLabel } from '../lib/format';
import { Modal } from '../components/Modal';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { IconEditar, IconEliminar } from '../components/icons';
import { OnboardingTour } from '../components/OnboardingTour';
import { useOnboardingTour } from '../lib/useOnboardingTour';

const ESTADOS: EstadoAuto[] = ['DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION'];

const FORM_INICIAL = { patente: '', marca: '', modelo: '', anio: '', kilometraje: '' };

type CampoOrdenable = 'patente' | 'marca' | 'modelo' | 'anio' | 'kilometraje' | 'estado';

const AUTOS_TOUR_STEPS = [
  {
    target: 'autos-nuevo',
    titulo: 'Agrega tus autos',
    texto: 'Registra un auto con su patente, marca, modelo y kilometraje.',
  },
  {
    target: 'autos-tabla',
    titulo: 'Tu listado de autos',
    texto:
      'Haz clic en la patente para ver el detalle del auto (mantenciones, pagos, arriendos). Usa los íconos para editar o eliminar.',
  },
];

export function AutosListPage() {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const tour = useOnboardingTour('autos');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sortField, setSortField] = useState<CampoOrdenable | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellValue, setCellValue] = useState('');

  const toggleSort = (campo: CampoOrdenable) => {
    if (sortField === campo) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(campo);
      setSortDir('asc');
    }
  };

  const valorOrdenable = (auto: Auto, campo: CampoOrdenable): string | number => {
    switch (campo) {
      case 'patente':
        return auto.patente;
      case 'marca':
        return auto.marca ?? '';
      case 'modelo':
        return auto.modelo ?? '';
      case 'anio':
        return auto.anio ?? 0;
      case 'kilometraje':
        return auto.kilometraje;
      case 'estado':
        return auto.estado;
    }
  };

  const autosOrdenados = useMemo(() => {
    if (!sortField) return autos;
    const copia = [...autos];
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
  }, [autos, sortField, sortDir]);

  const startEditCell = (auto: Auto) => {
    setEditingCell(auto.id);
    setCellValue(String(auto.kilometraje));
  };

  const commitCellEdit = async (auto: Auto) => {
    if (editingCell !== auto.id) return;
    setEditingCell(null);

    const raw = cellValue.trim();
    if (raw === '' || raw === String(auto.kilometraje)) return;

    const valor = Number(raw);
    if (Number.isNaN(valor)) return;

    await api.patch(`/autos/${auto.id}`, { kilometraje: valor });
    cargar();
  };

  const cargar = () => {
    setLoading(true);
    api
      .get<Auto[]>('/autos')
      .then(setAutos)
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

  const abrirEdicion = (auto: Auto) => {
    setForm({
      patente: auto.patente,
      marca: auto.marca ?? '',
      modelo: auto.modelo ?? '',
      anio: auto.anio ? String(auto.anio) : '',
      kilometraje: String(auto.kilometraje),
    });
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
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        anio: form.anio ? Number(form.anio) : undefined,
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
    await api.delete(`/autos/${id}`);
    cargar();
  };
  const eliminarAuto = useConfirmarEliminar<string>(handleDelete);

  const cambiarEstadoAuto = async (id: string, estado: string) => {
    await api.patch(`/autos/${id}`, { estado });
    cargar();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Autos</h1>
        <button type="button" data-tour="autos-nuevo" onClick={abrirCreacion}>
          + Nuevo auto
        </button>
      </div>

      {showForm && (
        <Modal titulo={editingId ? 'Editar auto' : 'Nuevo auto'} onClose={cerrarForm}>
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
              Marca
              <input
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </label>
            <label>
              Modelo
              <input
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </label>
            <label>
              Año
              <input
                type="number"
                min={1900}
                max={2100}
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: e.target.value })}
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
        </Modal>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && autos.length === 0 && <p className="empty-state">Aún no has agregado autos.</p>}

      {!loading && autos.length > 0 && (
        <div className="table-wrap" data-tour="autos-tabla">
          <table className="table">
            <thead>
              <tr>
                {(
                  [
                    ['patente', 'Patente'],
                    ['marca', 'Marca'],
                    ['modelo', 'Modelo'],
                    ['anio', 'Año'],
                    ['kilometraje', 'Kilometraje'],
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
              {autosOrdenados.map((auto) => (
                <tr key={auto.id}>
                  <td>
                    <Link to={`/autos/${auto.id}`}>{auto.patente}</Link>
                  </td>
                  <td>{auto.marca ?? '—'}</td>
                  <td>{auto.modelo ?? '—'}</td>
                  <td>{auto.anio ?? '—'}</td>
                  <td className="cell-editable" onClick={() => startEditCell(auto)}>
                    {editingCell === auto.id ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        className="cell-input"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => commitCellEdit(auto)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                      />
                    ) : (
                      `${auto.kilometraje.toLocaleString('es-CL')} km`
                    )}
                  </td>
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
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => abrirEdicion(auto)}
                      >
                        <IconEditar />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => eliminarAuto.pedir(auto.id)}
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
      {eliminarAuto.modal}
      {tour.activo && !loading && <OnboardingTour steps={AUTOS_TOUR_STEPS} onCerrar={tour.cerrar} />}
    </div>
  );
}
