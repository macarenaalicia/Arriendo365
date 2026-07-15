import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ArriendoPropiedad, EstadoArriendo, Persona, Propiedad } from '../api/types';
import { ddmmyyyyToIso } from '../lib/format';
import { DateInput } from '../components/DateInput';

const ESTADOS: Array<{ value: EstadoArriendo | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
  { value: 'TERMINADO', label: 'Terminados' },
];

const FORM_INICIAL = {
  propiedadId: '',
  arrendatarioId: '',
  codeudorId: '',
  fechaPago: '',
  fechaEntrega: '',
  periodoAlza: 'ANUAL',
  montoArriendo: '',
  garantia: false,
  garantiaMontoPactado: '',
};

function formatMonto(monto: string) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

export function ArriendosListPage() {
  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [estado, setEstado] = useState<EstadoArriendo | ''>('ACTIVO');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    setError(null);
    const query = estado ? `?estado=${estado}` : '';
    api
      .get<ArriendoPropiedad[]>(`/arriendos-propiedad${query}`)
      .then(setArriendos)
      .catch(() => setError('No se pudieron cargar los arriendos'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [estado]);
  useEffect(() => {
    api.get<Propiedad[]>('/propiedades').then(setPropiedades);
    api.get<Persona[]>('/personas').then(setPersonas);
  }, []);

  const cerrarForm = () => {
    setShowForm(false);
    setForm(FORM_INICIAL);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const fechaEntrega = ddmmyyyyToIso(form.fechaEntrega);
    if (!fechaEntrega) {
      setFormError('Fecha de entrega inválida, usa el formato dd/mm/aaaa.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/arriendos-propiedad', {
        propiedadId: form.propiedadId,
        arrendatarioId: form.arrendatarioId,
        codeudorId: form.codeudorId || undefined,
        fechaPago: Number(form.fechaPago),
        fechaEntrega,
        periodoAlza: form.periodoAlza,
        montoArriendo: Number(form.montoArriendo),
        garantia: form.garantia,
        garantiaMontoPactado: form.garantia && form.garantiaMontoPactado
          ? Number(form.garantiaMontoPactado)
          : undefined,
      });
      cerrarForm();
      cargar();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo crear el arriendo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Arriendos</h1>
        <div className="page-header__actions">
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoArriendo | '')}>
            {ESTADOS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={showForm ? cerrarForm : () => setShowForm(true)}>
            {showForm ? 'Cancelar' : '+ Nuevo arriendo'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Propiedad
              <select
                required
                value={form.propiedadId}
                onChange={(e) => setForm({ ...form, propiedadId: e.target.value })}
              >
                <option value="">Elige una propiedad…</option>
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.calle} {p.numero}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Arrendatario
              <select
                required
                value={form.arrendatarioId}
                onChange={(e) => setForm({ ...form, arrendatarioId: e.target.value })}
              >
                <option value="">Elige una persona…</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto} ({p.rut})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Codeudor (opcional)
              <select
                value={form.codeudorId}
                onChange={(e) => setForm({ ...form, codeudorId: e.target.value })}
              >
                <option value="">Sin codeudor</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto} ({p.rut})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Día de pago (1-31)
              <input
                type="number"
                min={1}
                max={31}
                required
                value={form.fechaPago}
                onChange={(e) => setForm({ ...form, fechaPago: e.target.value })}
              />
            </label>
            <label>
              Fecha de entrega
              <DateInput
                value={form.fechaEntrega}
                onChange={(value) => setForm({ ...form, fechaEntrega: value })}
                required
              />
            </label>
            <label>
              Periodo de reajuste
              <input
                required
                placeholder="ej. ANUAL"
                value={form.periodoAlza}
                onChange={(e) => setForm({ ...form, periodoAlza: e.target.value })}
              />
            </label>
            <label>
              Monto arriendo
              <input
                type="number"
                min={0}
                required
                value={form.montoArriendo}
                onChange={(e) => setForm({ ...form, montoArriendo: e.target.value })}
              />
            </label>
          </div>

          <div className="inline-form__checks">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.garantia}
                onChange={(e) => setForm({ ...form, garantia: e.target.checked })}
              />
              Con garantía
            </label>
          </div>

          {form.garantia && (
            <label>
              Monto garantía pactado
              <input
                type="number"
                min={0}
                value={form.garantiaMontoPactado}
                onChange={(e) => setForm({ ...form, garantiaMontoPactado: e.target.value })}
              />
            </label>
          )}

          {formError && <p className="auth-card__error">{formError}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar arriendo'}
          </button>
        </form>
      )}

      {loading && <p>Cargando…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && arriendos.length === 0 && (
        <p className="empty-state">No hay arriendos {estado ? estado.toLowerCase() : ''}.</p>
      )}

      <div className="card-list">
        {arriendos.map((arriendo) => (
          <Link key={arriendo.id} to={`/arriendos/${arriendo.id}`} className="card">
            <div className="card__title">
              {arriendo.propiedad.calle} {arriendo.propiedad.numero}
            </div>
            <div className="card__subtitle">{arriendo.arrendatario.nombreCompleto}</div>
            <div className="card__row">
              <span className={`badge badge--${arriendo.estado.toLowerCase()}`}>
                {arriendo.estado}
              </span>
              <span>{formatMonto(arriendo.montoArriendo)}/mes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
