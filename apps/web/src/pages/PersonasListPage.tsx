import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Persona, RolUsuario, Usuario } from '../api/types';
import { ddmmyyyyToIso, isoToDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { IconEditar, IconEliminar, IconLlave } from '../components/icons';

const FORM_INICIAL = {
  nombreCompleto: '',
  rut: '',
  tipoPersona: '' as RolUsuario | '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
};

const ROLES: RolUsuario[] = ['ARRENDATARIO', 'TECNICO', 'ADMINISTRADOR', 'PROPIETARIO'];

const TIPO_PERSONA_LABELS: Record<RolUsuario, string> = {
  ADMINISTRADOR: 'Administrador',
  PROPIETARIO: 'Propietario',
  ARRENDATARIO: 'Arrendatario',
  TECNICO: 'Técnico',
};

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
  const [accesoPersonaId, setAccesoPersonaId] = useState<string | null>(null);
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
      rut: persona.rut ?? '',
      tipoPersona: persona.tipoPersona ?? '',
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
        rut: form.rut || undefined,
        tipoPersona: form.tipoPersona || undefined,
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
    await api.delete(`/personas/${id}`);
    cargar();
  };
  const eliminarPersona = useConfirmarEliminar<string>(handleDelete);

  const abrirAcceso = (personaId: string) => {
    setAccesoPersonaId(personaId);
    setAccesoError(null);
    const usuario = usuarios.find((u) => u.personaId === personaId);
    setAccesoForm(
      usuario ? { rol: usuario.rol, activo: usuario.activo, password: '' } : ACCESO_FORM_INICIAL,
    );
  };

  const cerrarAcceso = () => {
    setAccesoPersonaId(null);
    setAccesoError(null);
  };

  const handleGuardarAcceso = async () => {
    if (!accesoPersonaId) return;
    const usuario = usuarios.find((u) => u.personaId === accesoPersonaId);

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
          personaId: accesoPersonaId,
          rol: accesoForm.rol,
          password: accesoForm.password,
        });
      }
      cargarUsuarios();
      cerrarAcceso();
    } catch (err) {
      setAccesoError(err instanceof ApiError ? err.message : 'No se pudo guardar el acceso');
    } finally {
      setSavingAcceso(false);
    }
  };

  const handleQuitarAcceso = async (usuarioId: string) => {
    await api.delete(`/usuarios/${usuarioId}`);
    cerrarAcceso();
    cargarUsuarios();
  };
  const eliminarAcceso = useConfirmarEliminar<string>(handleQuitarAcceso);

  return (
    <div>
      <div className="page-header">
        <h1>Personas</h1>
        <button type="button" onClick={abrirCreacion}>
          + Nueva persona
        </button>
      </div>

      {showForm && (
        <Modal titulo={editingId ? 'Editar persona' : 'Nueva persona'} onClose={cerrarForm}>
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
              RUT{form.tipoPersona === 'TECNICO' ? ' (opcional)' : ''}
              <input
                required={form.tipoPersona !== 'TECNICO'}
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
              />
            </label>
            <label>
              Tipo de persona
              <select
                value={form.tipoPersona}
                onChange={(e) =>
                  setForm({ ...form, tipoPersona: e.target.value as RolUsuario | '' })
                }
              >
                <option value="">Sin especificar</option>
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {TIPO_PERSONA_LABELS[rol]}
                  </option>
                ))}
              </select>
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
        </Modal>
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
                <th>Tipo</th>
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
                  <td>
                    {persona.tipoPersona && (
                      <span className={`badge badge--${persona.tipoPersona.toLowerCase()}`}>
                        {TIPO_PERSONA_LABELS[persona.tipoPersona]}
                      </span>
                    )}
                  </td>
                  <td>{persona.email ?? ''}</td>
                  <td>{persona.telefono ?? ''}</td>
                  <td>{persona.direccion ?? ''}</td>
                  <td>
                    <div className="table__actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Acceso al sistema"
                        aria-label="Acceso al sistema"
                        onClick={() => abrirAcceso(persona.id)}
                      >
                        <IconLlave />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => abrirEdicion(persona)}
                      >
                        <IconEditar />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => eliminarPersona.pedir(persona.id)}
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

      {accesoPersonaId && (() => {
        const persona = personas.find((p) => p.id === accesoPersonaId);
        const usuario = usuarios.find((u) => u.personaId === accesoPersonaId);
        return (
          <Modal titulo={`Acceso al sistema — ${persona?.nombreCompleto ?? ''}`} onClose={cerrarAcceso}>
            <div className="inline-form">
              {usuario ? (
                <p className="empty-state">
                  Ya tiene acceso como <strong>{usuario.rol}</strong>. Puedes cambiar el rol,
                  activar/desactivar la cuenta o resetear la contraseña.
                </p>
              ) : (
                <p className="empty-state">Esta persona todavía no tiene acceso al sistema.</p>
              )}

              <div className="inline-form__grid">
                <label>
                  Rol
                  <select
                    value={accesoForm.rol}
                    onChange={(e) =>
                      setAccesoForm({ ...accesoForm, rol: e.target.value as RolUsuario })
                    }
                  >
                    {ROLES.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {usuario ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  <input
                    type="password"
                    value={accesoForm.password}
                    onChange={(e) => setAccesoForm({ ...accesoForm, password: e.target.value })}
                  />
                </label>
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
              </div>

              {accesoError && <p className="auth-card__error">{accesoError}</p>}

              <div className="table__actions">
                <button type="button" disabled={savingAcceso} onClick={handleGuardarAcceso}>
                  {savingAcceso ? 'Guardando…' : usuario ? 'Guardar cambios' : 'Crear acceso'}
                </button>
                {usuario && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => eliminarAcceso.pedir(usuario.id)}
                  >
                    Quitar acceso
                  </button>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}
      {eliminarPersona.modal}
      {eliminarAcceso.modal}
    </div>
  );
}
