import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Auto, PerfilPersona, Persona, Propiedad, RolUsuario, Usuario } from '../api/types';
import { ddmmyyyyToIso, isoToDdmmyyyy, sufijoUnidadPropiedad } from '../lib/format';
import { esRutValido } from '../lib/rut';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { IconEditar, IconEliminar, IconLlave } from '../components/icons';
import { OnboardingTour } from '../components/OnboardingTour';
import { useOnboardingTour } from '../lib/useOnboardingTour';

const PERSONAS_TOUR_STEPS = [
  {
    target: 'personas-nueva',
    titulo: 'Agrega personas',
    texto:
      'Registra arrendatarios, propietarios, administradores, técnicos o codeudores. Según el perfil elegido, se les crea acceso automático al sistema.',
  },
  {
    target: 'personas-acceso',
    titulo: 'Acceso al sistema',
    texto: 'Con este ícono puedes revisar o cambiar el acceso (rol, contraseña) de cada persona.',
  },
];

const FORM_INICIAL = {
  nombreCompleto: '',
  rut: '',
  tipoPersona: '' as PerfilPersona | '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
};

const PERFILES: PerfilPersona[] = ['ARRENDATARIO', 'CODEUDOR', 'TECNICO', 'ADMINISTRADOR', 'PROPIETARIO'];

// Perfiles que corresponden a un uso real de la plataforma: al crear una
// persona con uno de estos perfiles el backend le crea acceso automático
// con contraseña inicial "1234" (debe cambiarla en su primer inicio de sesión).
const PERFILES_CON_ACCESO_AUTOMATICO: PerfilPersona[] = ['ADMINISTRADOR', 'PROPIETARIO', 'ARRENDATARIO'];
// Un técnico o codeudor nunca puede tener una cuenta de acceso.
const PERFILES_SIN_ACCESO: PerfilPersona[] = ['TECNICO', 'CODEUDOR'];

const PERFIL_PERSONA_LABELS: Record<PerfilPersona, string> = {
  ADMINISTRADOR: 'Administrador',
  PROPIETARIO: 'Propietario',
  ARRENDATARIO: 'Arrendatario',
  TECNICO: 'Técnico',
  CODEUDOR: 'Codeudor',
};

const ROLES_USUARIO: RolUsuario[] = ['ARRENDATARIO', 'ADMINISTRADOR', 'PROPIETARIO', 'TECNICO'];

const ACCESO_FORM_INICIAL = {
  rol: 'ARRENDATARIO' as RolUsuario,
  activo: true,
  password: '',
};

export function PersonasListPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const tour = useOnboardingTour('personas');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [accesoPersonaId, setAccesoPersonaId] = useState<string | null>(null);
  const [accesoForm, setAccesoForm] = useState(ACCESO_FORM_INICIAL);
  const [accesoError, setAccesoError] = useState<string | null>(null);
  const [savingAcceso, setSavingAcceso] = useState(false);

  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [autos, setAutos] = useState<Auto[]>([]);
  const [bienesForm, setBienesForm] = useState<{ propiedadIds: string[]; autoIds: string[] }>({
    propiedadIds: [],
    autoIds: [],
  });
  const [savingBienes, setSavingBienes] = useState(false);
  const [bienesError, setBienesError] = useState<string | null>(null);

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

    if (form.rut && !esRutValido(form.rut)) {
      setError('El RUT ingresado no es válido.');
      return;
    }

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
        if (form.tipoPersona && PERFILES_CON_ACCESO_AUTOMATICO.includes(form.tipoPersona)) {
          setMensaje(
            `Se creó acceso automático para ${form.nombreCompleto} con contraseña inicial "1234". Deberá cambiarla en su primer inicio de sesión.`,
          );
        }
      }

      cerrarForm();
      cargar();
      cargarUsuarios();
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
    setBienesError(null);
    setBienesForm({ propiedadIds: [], autoIds: [] });
    const usuario = usuarios.find((u) => u.personaId === personaId);
    setAccesoForm(
      usuario ? { rol: usuario.rol, activo: usuario.activo, password: '' } : ACCESO_FORM_INICIAL,
    );
  };

  // La lista de propiedades/autos para marcar (y los bienes ya asignados) se
  // cargan apenas el rol elegido en el formulario es ADMINISTRADOR, no solo
  // al abrir el modal — si el usuario recién elige ese rol (nuevo acceso o
  // al promover a alguien que tenía otro rol) igual debe ver algo que marcar.
  useEffect(() => {
    if (!accesoPersonaId || accesoForm.rol !== 'ADMINISTRADOR') return;
    if (propiedades.length === 0) api.get<Propiedad[]>('/propiedades').then(setPropiedades);
    if (autos.length === 0) api.get<Auto[]>('/autos').then(setAutos);
    const usuario = usuarios.find((u) => u.personaId === accesoPersonaId);
    if (usuario) {
      api
        .get<{ propiedadIds: string[]; autoIds: string[] }>(`/usuarios/${usuario.id}/bienes`)
        .then(setBienesForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accesoPersonaId, accesoForm.rol]);

  const cerrarAcceso = () => {
    setAccesoPersonaId(null);
    setAccesoError(null);
  };

  const toggleBienPropiedad = (propiedadId: string) => {
    setBienesForm((prev) => ({
      ...prev,
      propiedadIds: prev.propiedadIds.includes(propiedadId)
        ? prev.propiedadIds.filter((id) => id !== propiedadId)
        : [...prev.propiedadIds, propiedadId],
    }));
  };

  const toggleBienAuto = (autoId: string) => {
    setBienesForm((prev) => ({
      ...prev,
      autoIds: prev.autoIds.includes(autoId)
        ? prev.autoIds.filter((id) => id !== autoId)
        : [...prev.autoIds, autoId],
    }));
  };

  const handleGuardarBienes = async (usuarioId: string) => {
    setBienesError(null);
    setSavingBienes(true);
    try {
      await api.put(`/usuarios/${usuarioId}/bienes`, bienesForm);
    } catch (err) {
      setBienesError(err instanceof ApiError ? err.message : 'No se pudieron guardar los bienes asignados');
    } finally {
      setSavingBienes(false);
    }
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

  // Un técnico o codeudor nunca tiene Usuario (no es "inactivo", es un
  // perfil sin acceso por diseño) — solo se oculta a quien tuvo acceso y se
  // le desactivó, para no perder de vista arrendatarios/administradores
  // desactivados por error.
  const personasVisibles = personas.filter((persona) => {
    const usuario = usuarios.find((u) => u.personaId === persona.id);
    if (!usuario || usuario.activo) return true;
    return mostrarInactivos;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Personas</h1>
        <div className="page-header__actions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar personas con acceso desactivado
          </label>
          <button type="button" data-tour="personas-nueva" onClick={abrirCreacion}>
            + Nueva persona
          </button>
        </div>
      </div>

      {mensaje && (
        <p className="empty-state">
          {mensaje}{' '}
          <button type="button" className="link-button" onClick={() => setMensaje(null)}>
            Cerrar
          </button>
        </p>
      )}

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
              Perfil
              <select
                value={form.tipoPersona}
                onChange={(e) =>
                  setForm({ ...form, tipoPersona: e.target.value as PerfilPersona | '' })
                }
              >
                <option value="">Sin especificar</option>
                {PERFILES.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {PERFIL_PERSONA_LABELS[perfil]}
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

      {!loading && personasVisibles.length === 0 && (
        <p className="empty-state">
          {personas.length === 0
            ? 'Aún no has agregado personas.'
            : 'No hay personas con acceso activo. Activa "Mostrar personas con acceso desactivado" para verlas.'}
        </p>
      )}

      {!loading && personasVisibles.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Perfil</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personasVisibles.map((persona) => {
                const usuario = usuarios.find((u) => u.personaId === persona.id);
                return (
                <tr key={persona.id}>
                  <td>
                    {persona.nombreCompleto}
                    {usuario && !usuario.activo && (
                      <span className="badge badge--rechazado" style={{ marginLeft: '0.5rem' }}>
                        Acceso desactivado
                      </span>
                    )}
                  </td>
                  <td>{persona.rut}</td>
                  <td>
                    {persona.tipoPersona && (
                      <span className={`badge badge--${persona.tipoPersona.toLowerCase()}`}>
                        {PERFIL_PERSONA_LABELS[persona.tipoPersona]}
                      </span>
                    )}
                  </td>
                  <td>{persona.email ?? ''}</td>
                  <td>{persona.telefono ?? ''}</td>
                  <td>{persona.direccion ?? ''}</td>
                  <td>
                    <div className="table__actions">
                      {!(persona.tipoPersona && PERFILES_SIN_ACCESO.includes(persona.tipoPersona)) && (
                        <button
                          type="button"
                          data-tour="personas-acceso"
                          className="icon-button"
                          title="Acceso al sistema"
                          aria-label="Acceso al sistema"
                          onClick={() => abrirAcceso(persona.id)}
                        >
                          <IconLlave />
                        </button>
                      )}
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
                );
              })}
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
                    {ROLES_USUARIO.map((rol) => (
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

              {usuario && accesoForm.rol === 'ADMINISTRADOR' && (
                <div className="proveedores-panel">
                  <h3>Bienes que administra</h3>
                  <p className="empty-state">
                    Sin marcar ningún bien, este administrador ve todos los de la organización
                    (como hoy). Marca solo los bienes que debe administrar para acotar su acceso.
                  </p>
                  <div className="inline-form__grid">
                    <div>
                      <strong>Propiedades</strong>
                      {propiedades.map((p) => (
                        <label key={p.id} className="checkbox">
                          <input
                            type="checkbox"
                            checked={bienesForm.propiedadIds.includes(p.id)}
                            onChange={() => toggleBienPropiedad(p.id)}
                          />
                          {p.calle} {p.numero}
                          {sufijoUnidadPropiedad(p)}
                        </label>
                      ))}
                    </div>
                    <div>
                      <strong>Autos</strong>
                      {autos.map((a) => (
                        <label key={a.id} className="checkbox">
                          <input
                            type="checkbox"
                            checked={bienesForm.autoIds.includes(a.id)}
                            onChange={() => toggleBienAuto(a.id)}
                          />
                          {a.patente}
                        </label>
                      ))}
                    </div>
                  </div>
                  {bienesError && <p className="auth-card__error">{bienesError}</p>}
                  <button
                    type="button"
                    disabled={savingBienes}
                    onClick={() => handleGuardarBienes(usuario.id)}
                  >
                    {savingBienes ? 'Guardando…' : 'Guardar bienes asignados'}
                  </button>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
      {eliminarPersona.modal}
      {eliminarAcceso.modal}
      {tour.activo && !loading && (
        <OnboardingTour steps={PERSONAS_TOUR_STEPS} onCerrar={tour.cerrar} />
      )}
    </div>
  );
}
