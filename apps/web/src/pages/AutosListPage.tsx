import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Auto, EstadoAuto } from '../api/types';
import { formatEnumLabel } from '../lib/format';
import { Modal } from '../components/Modal';
import { IconEliminar } from '../components/icons';

const ESTADOS: EstadoAuto[] = ['DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION'];

const FORM_INICIAL = { patente: '', kilometraje: '' };

export function AutosListPage() {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    setForm(FORM_INICIAL);
    setError(null);
  };

  const abrirCreacion = () => {
    setForm(FORM_INICIAL);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post('/autos', {
        patente: form.patente.toUpperCase(),
        kilometraje: Number(form.kilometraje),
      });
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

  return (
    <div>
      <div className="page-header">
        <h1>Autos</h1>
        <button type="button" onClick={abrirCreacion}>
          + Nuevo auto
        </button>
      </div>

      {showForm && (
        <Modal titulo="Nuevo auto" onClose={cerrarForm}>
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
            {saving ? 'Guardando…' : 'Guardar auto'}
          </button>
        </form>
        </Modal>
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
                  <td>
                    <Link to={`/autos/${auto.id}`}>{auto.patente}</Link>
                  </td>
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
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(auto.id)}
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
    </div>
  );
}
