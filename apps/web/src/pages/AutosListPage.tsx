import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Auto, EstadoAuto } from '../api/types';
import { formatEnumLabel } from '../lib/format';

const ESTADOS: EstadoAuto[] = ['DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION'];

const FORM_INICIAL = { patente: '', kilometraje: '', estado: 'DISPONIBLE' as EstadoAuto };

export function AutosListPage() {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setForm({ patente: auto.patente, kilometraje: String(auto.kilometraje), estado: auto.estado });
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
        estado: form.estado,
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
            {editingId && (
              <label>
                Estado
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoAuto })}
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {formatEnumLabel(estado)}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
                <tr key={auto.id}>
                  <td>{auto.patente}</td>
                  <td>{auto.kilometraje.toLocaleString('es-CL')} km</td>
                  <td>
                    <span className={`badge badge--${auto.estado.toLowerCase()}`}>
                      {formatEnumLabel(auto.estado)}
                    </span>
                  </td>
                  <td>
                    <div className="table__actions">
                      <button type="button" onClick={() => abrirEdicion(auto)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(auto.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
