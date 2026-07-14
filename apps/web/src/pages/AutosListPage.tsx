import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Auto } from '../api/types';

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post('/autos', {
        patente: form.patente.toUpperCase(),
        kilometraje: Number(form.kilometraje),
      });
      setForm(FORM_INICIAL);
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el auto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Autos</h1>
        <button type="button" onClick={() => setShowForm((v) => !v)}>
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
            {saving ? 'Guardando…' : 'Guardar auto'}
          </button>
        </form>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && autos.length === 0 && <p className="empty-state">Aún no has agregado autos.</p>}

      <div className="card-list">
        {autos.map((auto) => (
          <div key={auto.id} className="card card--static">
            <div className="card__title">{auto.patente}</div>
            <div className="card__row">
              <span className={`badge badge--${auto.estado.toLowerCase()}`}>{auto.estado}</span>
              <span>{auto.kilometraje.toLocaleString('es-CL')} km</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
