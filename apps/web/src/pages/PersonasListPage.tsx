import { Fragment, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Persona, RolUsuario, Usuario } from '../api/types';
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

const ROLES: RolUsuario[] = ['ADMINISTRADOR', 'PROPIETARIO', 'ARRENDATARIO', 'TECNICO'];

const ACCESO_FORM_INICIAL = {
  rol: 'ARRENDATARIO' as RolUsuario,
  activo: true,
  password: '',
};

export function PersonasListPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accesoForm, setAccesoForm] = useState(ACCESO_FORM_INICIAL);
  const [accesoError, setAccesoError] = useState<string | null>(null);
  const [savingAcceso, setSavingAcceso] = useState(false);

  const cargar = () => {
    setLoading(true);
    api
      .get<Persona[]>('/personas')
      .then(setPersonas)
      .finally(() => setLoading(false));
  };

  const cargarUsuarios = () => {
    api.get<Usuario[]>('/usuarios').then(setUsuarios);
  };

  useEffect(cargar, []);
  useEffect(cargarUsuarios, []);

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

  const toggleAcceso = (personaId: string) => {
    if (expandedId === personaId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(personaId);
    setAccesoError(null);
    const usuario = usuarios.find((u) => u.personaId === personaId);
    setAccesoForm(
      usuario
        ? { rol: usuario.rol, activo: usuario.activo, password: '' }
        : ACCESO_FORM_INICIAL,
    );
  };

  const handleGuardarAcceso = async (personaId: string) => {
    const usuario = usuarios.find((u) => u.personaId === personaId);

    if (!usuario && !accesoForm.password) {
      setAccesoError('Define una contraseña para crear el acceso.');
      return;
    }
    if (accesoForm.password && accesoForm.password.length < 8) {
      setAccesoError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setAccesoError(null);
    setSavingAcceso(true);
    try {
      if (usuario) {
        await api.patch(`/usuarios/${usuario.id}`, {
          rol: accesoForm.rol,
          activo: accesoForm.activo,
          password: accesoForm.password || undefined,
        });
      } else {
        await api.post('/usuarios', {
          personaId,
          rol: accesoForm.rol,
          password: accesoForm.password,
        });
      }
      cargarUsuarios();
      setAccesoForm({ ...accesoForm, password: '' });
    } catch (err) {
      setAccesoError(err instanceof ApiError ? err.message : 'No se pudo guardar el acceso');
    } finally {
      setSavingAcceso(false);
    }
  };

  const handleQuitarAcceso = async (usuarioId: string) => {
    if (!confirm('¿Quitar el acceso al sistema de esta persona?')) return;
    await api.delete(`/usuarios/${usuarioId}`);
    setExpandedId(null);
    cargarUsuarios();
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
                <th>Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((persona) => {
                const usuario = usuarios.find((u) => u.personaId === persona.id);
                return (
                  <Fragment key={persona.id}>
                    <tr>
                      <td>{persona.nombreCompleto}</td>
                      <td>{persona.rut}</td>
                      <td>{persona.email ?? ''}</td>
                      <td>{persona.telefono ?? ''}</td>
                      <td>{persona.direccion ?? ''}</td>
                      <td>
                        {usuario ? (
                          <span
                            className={`badge badge--${usuario.activo ? 'activo' : 'inactivo'}`}
                          >
                            {usuario.rol}
                          </span>
                        ) : (
                          <span className="empty-state">Sin acceso</span>
                        )}
                      </td>
                      <td>
                        <div className="table__actions">
                          <button type="button" onClick={() => abrirEdicion(persona)}>
                            Editar
                          </button>
                          <button type="button" onClick={() => toggleAcceso(persona.id)}>
                            {expandedId === persona.id ? 'Ocultar' : 'Acceso'}
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

                    {expandedId === persona.id && (
                      <tr>
                        <td colSpan={7}>
                          <div className="proveedores-panel">
                            {accesoError && <p className="auth-card__error">{accesoError}</p>}
                            <div className="proveedores-panel__add">
                              <select
                                value={accesoForm.rol}
                                onChange={(e) =>
                                  setAccesoForm({
                                    ...accesoForm,
                                    rol: e.target.value as RolUsuario,
                                  })
                                }
                              >
                                {ROLES.map((rol) => (
                                  <option key={rol} value={rol}>
                                    {rol}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="password"
                                placeholder={
                                  usuario ? 'Nueva contraseña (opcional)' : 'Contraseña'
                                }
                                value={accesoForm.password}
                                onChange={(e) =>
                                  setAccesoForm({ ...accesoForm, password: e.target.value })
                                }
                              />
                              {usuario && (
                                <label className="checkbox">
                                  <input
                                    type="checkbox"
                                    checked={accesoForm.activo}
                                    onChange={(e) =>
                                      setAccesoForm({ ...accesoForm, activo: e.target.checked })
                                    }
                                  />
                                  Activo
                                </label>
                              )}
                              <button
                                type="button"
                                disabled={savingAcceso}
                                onClick={() => handleGuardarAcceso(persona.id)}
                              >
                                {usuario ? 'Guardar cambios' : 'Crear acceso'}
                              </button>
                              {usuario && (
                                <button
                                  type="button"
                                  className="danger danger--small"
                                  onClick={() => handleQuitarAcceso(usuario.id)}
                                >
                                  Quitar acceso
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
