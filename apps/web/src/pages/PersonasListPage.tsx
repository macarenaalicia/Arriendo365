import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Persona } from '../api/types';
import { ddmmyyyyToIso, isoToDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';

const FORM_INICIAL = {
  nombreCompleto: '',
  rut: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
};

export function PersonasListPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    api
      .get<Persona[]>('/personas')
      .then(setPersonas)
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

  const abrirEdicion = (persona: Persona) => {
    setForm({
      nombreCompleto: persona.nombreCompleto,
      rut: persona.rut,
      email: persona.email ?? '',
      telefono: persona.telefono ?? '',
      direccion: persona.direccion ?? '',
      fechaNacimiento: isoToDdmmyyyy(persona.fechaNacimiento),
    });
    setEditingId(persona.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    let fechaNacimiento: string | undefined;
    if (form.fechaNacimiento) {
      fechaNacimiento = ddmmyyyyToIso(form.fechaNacimiento);
      if (!fechaNacimiento) {
        setError('Fecha de nacimiento inválida, usa el formato dd/mm/aaaa.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        nombreCompleto: form.nombreCompleto,
        rut: form.rut,
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        direccion: form.direccion || undefined,
        fechaNacimiento,
      };

      if (editingId) {
        await api.patch(`/personas/${editingId}`, payload);
      } else {
        await api.post('/personas', payload);
      }

      cerrarForm();
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la persona');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta persona?')) return;
    await api.delete(`/personas/${id}`);
    cargar();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Personas</h1>
        <button type="button" onClick={showForm ? cerrarForm : abrirCreacion}>
          {showForm ? 'Cancelar' : '+ Nueva persona'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Nombre completo
              <input
                required
                value={form.nombreCompleto}
                onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
              />
            </label>
            <label>
              RUT
              <input
                required
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Teléfono
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </label>
            <label>
              Dirección
              <input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </label>
            <label>
              Fecha de nacimiento
              <DateInput
                value={form.fechaNacimiento}
                onChange={(value) => setForm({ ...form, fechaNacimiento: value })}
              />
            </label>
          </div>

          {error && <p className="auth-card__error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar persona'}
          </button>
        </form>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && personas.length === 0 && (
        <p className="empty-state">Aún no has agregado personas.</p>
      )}

      {!loading && personas.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((persona) => (
                <tr key={persona.id}>
                  <td>{persona.nombreCompleto}</td>
                  <td>{persona.rut}</td>
                  <td>{persona.email ?? ''}</td>
                  <td>{persona.telefono ?? ''}</td>
                  <td>{persona.direccion ?? ''}</td>
                  <td>
                    <div className="table__actions">
                      <button type="button" onClick={() => abrirEdicion(persona)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(persona.id)}
                      >
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
